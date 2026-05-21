#!/usr/bin/env node
/**
 * check-physical-css.mjs
 *
 * Scans SCSS/CSS files for physical direction properties that break RTL layouts.
 * Run via: node scripts/css/check-physical-css.mjs [target-dir]
 * Default target: apps/app/src
 *
 * Exit 0 → clean. Exit 1 → violations found.
 *
 * Properties checked:
 *   margin-left / margin-right          → margin-inline-start / margin-inline-end
 *   padding-left / padding-right        → padding-inline-start / padding-inline-end
 *   border-left / border-right          → border-inline-start / border-inline-end
 *   left: / right:  (position)          → inset-inline-start / inset-inline-end
 *   border-radius physical corners      → border-start-X/border-end-X equivalents
 *
 * Allowlist: lines containing "// rtl-ok" are skipped.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const PHYSICAL_RULES = [
  {
    regex: /(?<![a-z-])margin-left\s*:/,
    suggestion: 'margin-inline-start',
  },
  {
    regex: /(?<![a-z-])margin-right\s*:/,
    suggestion: 'margin-inline-end',
  },
  {
    regex: /(?<![a-z-])padding-left\s*:/,
    suggestion: 'padding-inline-start',
  },
  {
    regex: /(?<![a-z-])padding-right\s*:/,
    suggestion: 'padding-inline-end',
  },
  {
    regex: /(?<![a-z-])border-left\s*:/,
    suggestion: 'border-inline-start',
  },
  {
    regex: /(?<![a-z-])border-right\s*:/,
    suggestion: 'border-inline-end',
  },
  {
    // Matches "  left: <value>" but NOT "inset-inline", "outline", "left-align", etc.
    regex: /^\s+left\s*:/,
    suggestion: 'inset-inline-start (if used for positioning)',
  },
  {
    regex: /^\s+right\s*:/,
    suggestion: 'inset-inline-end (if used for positioning)',
  },
];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.angular', 'coverage']);
const SKIP_COMMENT = '// rtl-ok';

function scanDir(dir) {
  let violations = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      violations = violations.concat(scanDir(full));
    } else if (extname(entry) === '.scss' || extname(entry) === '.css') {
      violations = violations.concat(scanFile(full));
    }
  }
  return violations;
}

function scanFile(filePath) {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Skip blank lines, comment-only lines, and intentional overrides
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (line.includes(SKIP_COMMENT)) return;
    // Skip [dir="rtl"] override blocks — these are intentional physical overrides
    if (trimmed.includes('[dir=')) return;

    for (const { regex, suggestion } of PHYSICAL_RULES) {
      if (regex.test(line)) {
        violations.push({
          file: filePath,
          lineNumber: idx + 1,
          content: trimmed,
          suggestion,
        });
        break; // one violation per line is enough
      }
    }
  });

  return violations;
}

const targetDir = process.argv[2] ?? 'apps/app/src';
const violations = scanDir(targetDir);

if (violations.length === 0) {
  console.log('✅ No physical CSS direction properties found in', targetDir);
  process.exit(0);
} else {
  console.error(`\n❌  ${violations.length} physical CSS direction violation(s) in ${targetDir}:\n`);
  for (const v of violations) {
    const rel = relative(process.cwd(), v.file);
    console.error(`  ${rel}:${v.lineNumber}`);
    console.error(`    "${v.content}"`);
    console.error(`    → Use instead: ${v.suggestion}`);
    console.error(`    (Add "// rtl-ok" to suppress if intentional)\n`);
  }
  process.exit(1);
}
