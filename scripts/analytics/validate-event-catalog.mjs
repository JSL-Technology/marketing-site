import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const catalogSource = readFileSync('apps/app/src/app/core/services/analytics-events.ts', 'utf8');
const catalogMatch = catalogSource.match(/EVENT_CATALOG = \{([\s\S]*?)\} as const/);
if (!catalogMatch) throw new Error('EVENT_CATALOG not found');
const eventNames = [...catalogMatch[1].matchAll(/\n\s*([a-z0-9_]+):\s*\[/gi)].map((m) => m[1]);
const known = new Set(eventNames);

const rgOutput = execSync("rg -n \"trackEvent\\(\\s*['\\\"]([a-z0-9_]+)['\\\"]\" apps/app/src/app -g '*.ts'", { encoding: 'utf8' });
const unknownUsages = [];
for (const line of rgOutput.trim().split('\n')) {
  if (!line) continue;
  const match = line.match(/trackEvent\(\s*['\"]([a-z0-9_]+)['\"]/i);
  if (!match) continue;
  const event = match[1];
  if (!known.has(event)) unknownUsages.push(`${line.split(':').slice(0,2).join(':')} -> ${event}`);
}

if (unknownUsages.length) {
  console.error('Unknown analytics events detected:');
  for (const u of unknownUsages) console.error(` - ${u}`);
  process.exit(1);
}

console.log(`Analytics catalog validation passed. Events in catalog: ${eventNames.length}`);
