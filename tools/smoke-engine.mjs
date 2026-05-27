import { runSystemSettingsEngine, runFinalCalculationEngine } from '../src/engine/core/engineGateway.js';

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

const system = runSystemSettingsEngine(sample);
const final = runFinalCalculationEngine(sample);

for (const [name, result] of [['systemSettings', system], ['finalCalculation', final]]) {
  if (!result?.calculationsEnabled) throw new Error(`${name}: calculations are not enabled`);
  if (!Array.isArray(result.appliedRules) || result.appliedRules.length < 5) throw new Error(`${name}: rules did not run`);
  if (!result.summary?.pv) throw new Error(`${name}: summary was not generated`);
  console.log(`[OK] ${name}`, {
    ok: result.ok,
    mode: result.mode,
    appliedRules: result.appliedRules.length,
    warnings: result.warnings.length,
    panelCount: result.summary.pv.count,
    inverter: result.summary.inverter,
  });
}
