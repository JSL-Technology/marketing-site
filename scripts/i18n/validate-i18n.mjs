import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const I18N_DIR = path.resolve('apps/app/src/assets/i18n');
const BASE_LANG = 'en.json';

/**
 * Flattens a nested JSON object into a single-level object with dotted keys.
 */
function flattenJson(obj, prefix = '', output = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const dottedKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenJson(value, dottedKey, output);
    } else {
      output[dottedKey] = value;
    }
  }
  return output;
}

/**
 * Extracts {{placeholder}} tokens from a string.
 */
function getPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(m => m.slice(2, -2).trim()).sort();
}

/**
 * Performs a comprehensive audit of all translation files against the base language.
 */
async function validate() {
  const files = (await readdir(I18N_DIR)).filter(f => f.endsWith('.json'));
  const baseContent = JSON.parse(await readFile(path.join(I18N_DIR, BASE_LANG), 'utf8'));
  const baseFlat = flattenJson(baseContent);
  const baseKeys = Object.keys(baseFlat);

  let hasCriticalErrors = false;
  const reports = [];

  for (const file of files) {
    if (file === BASE_LANG) continue;

    const lang = file.split('.')[0];
    let content;
    try {
      content = JSON.parse(await readFile(path.join(I18N_DIR, file), 'utf8'));
    } catch (e) {
      console.error(`❌ CRITICAL: Failed to parse ${file}: ${e.message}`);
      hasCriticalErrors = true;
      continue;
    }

    const flat = flattenJson(content);
    const keys = Object.keys(flat);

    const missingKeys = baseKeys.filter(k => !keys.includes(k));
    const extraKeys = keys.filter(k => !baseKeys.includes(k));
    const typeMismatches = [];
    const placeholderMismatches = [];
    const emptyValues = [];
    const sameAsEn = [];

    for (const key of baseKeys) {
      if (flat[key] !== undefined) {
        // Type Consistency
        if (typeof flat[key] !== typeof baseFlat[key]) {
          typeMismatches.push({ key, expected: typeof baseFlat[key], actual: typeof flat[key] });
        } else if (typeof flat[key] === 'string') {
          // Empty Values
          if (baseFlat[key] !== "" && !flat[key].trim()) {
            emptyValues.push(key);
          }

          // Placeholder Consistency
          const basePH = getPlaceholders(baseFlat[key]);
          const ph = getPlaceholders(flat[key]);
          if (JSON.stringify(basePH) !== JSON.stringify(ph)) {
            placeholderMismatches.push({ key, expected: basePH, actual: ph });
          }

          // Identity check (for warning)
          if (flat[key] === baseFlat[key] && flat[key].length > 5 && !key.startsWith('LANG.')) {
            sameAsEn.push(key);
          }
        }
      }
    }

    if (missingKeys.length || extraKeys.length || typeMismatches.length || placeholderMismatches.length || emptyValues.length) {
      hasCriticalErrors = true;
    }

    reports.push({
      lang,
      missingKeys,
      extraKeys,
      typeMismatches,
      placeholderMismatches,
      emptyValues,
      sameAsEn
    });
  }

  // Output formatting
  reports.forEach(report => {
    console.log(`\n--- Report for ${report.lang.toUpperCase()} ---`);
    if (report.missingKeys.length) {
      console.error(`❌ Missing keys (${report.missingKeys.length}):`);
      report.missingKeys.slice(0, 10).forEach(k => console.error(`   - ${k}`));
      if (report.missingKeys.length > 10) console.error(`   ... and ${report.missingKeys.length - 10} more`);
    }
    if (report.extraKeys.length) {
      console.error(`❌ Extra keys (${report.extraKeys.length}):`);
      report.extraKeys.slice(0, 10).forEach(k => console.error(`   - ${k}`));
      if (report.extraKeys.length > 10) console.error(`   ... and ${report.extraKeys.length - 10} more`);
    }
    if (report.typeMismatches.length) {
      console.error(`❌ Type mismatches (${report.typeMismatches.length}):`);
      report.typeMismatches.forEach(m => console.error(`   - ${m.key}: expected ${m.expected}, got ${m.actual}`));
    }
    if (report.placeholderMismatches.length) {
      console.error(`❌ Placeholder mismatches (${report.placeholderMismatches.length}):`);
      report.placeholderMismatches.forEach(m => {
        const expStr = m.expected.length ? `{{${m.expected.join('}}, {{')}}}` : 'None';
        const actStr = m.actual.length ? `{{${m.actual.join('}}, {{')}}}` : 'None';
        console.error(`   - ${m.key}: expected ${expStr}, got ${actStr}`);
      });
    }
    if (report.emptyValues.length) {
      console.error(`❌ Empty values (${report.emptyValues.length}):`);
      report.emptyValues.slice(0, 10).forEach(k => console.error(`   - ${k}`));
    }
    if (report.sameAsEn.length) {
      console.warn(`⚠️ Same as English (${report.sameAsEn.length}) - potential untranslated strings.`);
    }
  });

  if (hasCriticalErrors) {
    console.error('\nI18n validation failed with critical errors.');
    process.exit(1);
  } else {
    console.log('\nI18n validation passed successfully.');
  }
}

validate().catch(err => {
  console.error('An unexpected error occurred during validation:', err);
  process.exit(1);
});
