#!/usr/bin/env node
/**
 * check-i18n-parity.mjs
 *
 * Validates that every i18n JSON file shares the same key set as en.json.
 * Run via: node scripts/i18n/check-i18n-parity.mjs
 *
 * Exit 0 → all files match en.json. Exit 1 → parity issues found.
 *
 * Options (env vars):
 *   I18N_DIR   Override the default i18n directory.
 *   BASE_LANG  Override the reference language (default: 'en').
 *   STRICT     If set to '1', extra keys in target files also fail the check.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const I18N_DIR = process.env['I18N_DIR'] ?? 'apps/app/src/assets/i18n';
const BASE_LANG = process.env['BASE_LANG'] ?? 'en';
const STRICT = process.env['STRICT'] === '1';

/**
 * Recursively flatten a nested JSON object into dot-notation keys.
 * e.g. { a: { b: 'val' } } → ['a.b']
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

function loadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`❌  Failed to parse ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

const allFiles = readdirSync(I18N_DIR).filter((f) => f.endsWith('.json'));
const baseFile = path.join(I18N_DIR, `${BASE_LANG}.json`);
const baseObj = loadJson(baseFile);
const baseKeys = new Set(flattenKeys(baseObj));

let hasErrors = false;
const report = [];

for (const file of allFiles) {
  const lang = file.replace('.json', '');
  if (lang === BASE_LANG) continue;

  const obj = loadJson(path.join(I18N_DIR, file));
  const langKeys = new Set(flattenKeys(obj));

  const missing = [...baseKeys].filter((k) => !langKeys.has(k));
  const extra = STRICT ? [...langKeys].filter((k) => !baseKeys.has(k)) : [];

  if (missing.length > 0 || extra.length > 0) {
    hasErrors = true;
    report.push({ lang, missing, extra });
  }
}

if (!hasErrors) {
  console.log(`✅  All ${allFiles.length - 1} translation files match ${BASE_LANG}.json key set.`);
  process.exit(0);
}

console.error(`\n❌  i18n key parity failures:\n`);
for (const { lang, missing, extra } of report) {
  const filePath = path.join(I18N_DIR, `${lang}.json`);
  console.error(`  [${lang}] ${filePath}`);

  if (missing.length > 0) {
    console.error(`    Missing ${missing.length} key(s) vs ${BASE_LANG}.json:`);
    for (const k of missing.slice(0, 30)) {
      console.error(`      - ${k}`);
    }
    if (missing.length > 30) {
      console.error(`      ... and ${missing.length - 30} more`);
    }
  }

  if (extra.length > 0) {
    console.error(`    Extra ${extra.length} key(s) not present in ${BASE_LANG}.json:`);
    for (const k of extra.slice(0, 30)) {
      console.error(`      + ${k}`);
    }
  }

  console.error('');
}

process.exit(1);
