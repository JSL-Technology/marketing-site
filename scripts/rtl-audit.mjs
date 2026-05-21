import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const PHYSICAL_PROPERTIES = [
  { pattern: /margin-left\s*:/g, suggestion: 'margin-inline-start' },
  { pattern: /margin-right\s*:/g, suggestion: 'margin-inline-end' },
  { pattern: /padding-left\s*:/g, suggestion: 'padding-inline-start' },
  { pattern: /padding-right\s*:/g, suggestion: 'padding-inline-end' },
  { pattern: /border-left\s*:/g, suggestion: 'border-inline-start' },
  { pattern: /border-right\s*:/g, suggestion: 'border-inline-end' },
  { pattern: /left\s*:/g, suggestion: 'inset-inline-start' },
  { pattern: /right\s*:/g, suggestion: 'inset-inline-end' },
  { pattern: /text-align\s*:\s*left/g, suggestion: 'text-align: start' },
  { pattern: /text-align\s*:\s*right/g, suggestion: 'text-align: end' },
  { pattern: /float\s*:\s*left/g, suggestion: 'float: inline-start' },
  { pattern: /float\s*:\s*right/g, suggestion: 'float: inline-end' },
];

const EXCLUSIONS = [/node_modules/, /\.git/, /dist/, /\.nx/];

function walk(dir, callback) {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach((f) => {
    const path = join(dir, f);
    if (EXCLUSIONS.some((re) => re.test(path))) return;
    if (statSync(path).isDirectory()) {
      walk(path, callback);
    } else {
      callback(path);
    }
  });
}

const issues = [];
walk('apps/app/src/app', (path) => {
  if (['.scss', '.ts', '.html'].includes(extname(path))) {
    const fileIssues = [];
    const content = readFileSync(path, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) return;
        if (line.includes('/* rtl:ignore */')) return;
        PHYSICAL_PROPERTIES.forEach(({ pattern, suggestion }) => {
            if (line.match(pattern)) {
                fileIssues.push({ line: index + 1, content: line.trim(), suggestion });
            }
        });
    });
    if (fileIssues.length > 0) {
      issues.push({ path, fileIssues });
    }
  }
});

if (issues.length === 0) {
  console.log('✅ RTL Compliance Audit Passed.');
} else {
  console.error('❌ RTL Compliance Audit Failed!');
  issues.forEach((issue) => {
    console.error(`FILE: ${issue.path}`);
    issue.fileIssues.forEach((i) => {
      console.error(`  [${i.line}] ${i.content} -> Suggested: ${i.suggestion}`);
    });
  });
}
