import fs from 'node:fs';
import path from 'node:path';
import { runFinalCalculationEngine } from '../src/engine/core/engineGateway.js';

const sample = {
  scenario: 'hybrid',
  dailyEnergyKWh: 18,
  peakLoadW: 5200,
  backupHours: 6,
  sunHours: 5.2,
  environmentType: 'roof',
  ambientMinC: -5,
  ambientMaxC: 45,
};

const result = runFinalCalculationEngine(sample, { profile: 'SAFE_PRODUCTION' });
const report = {
  generatedAt: new Date().toISOString(),
  package: 'SHIL operational engine readiness report',
  input: sample,
  operational: result.operational,
  appliedRules: result.appliedRules,
  warnings: result.warnings,
  errors: result.errors,
  summary: result.summary,
  values: result.values,
};

const outDir = path.join(process.cwd(), 'public', 'diagnostics');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'engine-health.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Engine health report exported:', path.join('public', 'diagnostics', 'engine-health.json'));
