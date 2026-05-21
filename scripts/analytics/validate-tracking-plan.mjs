import fs from 'node:fs';

const plan = JSON.parse(fs.readFileSync('docs/tracking-plan.v1.json', 'utf8'));
const code = fs.readFileSync('apps/app/src/app/core/services/analytics-events.ts', 'utf8');

const missing = [];
for (const eventName of Object.keys(plan.events)) {
  if (!code.includes(`${eventName}:`)) missing.push(eventName);
}

if (missing.length > 0) {
  console.error('error_event_schema_mismatch: events missing in code', missing.join(', '));
  process.exit(1);
}

console.log('Tracking plan and code catalog are in sync.');
