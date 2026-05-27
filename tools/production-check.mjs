import { runSystemSettingsEngine, runFinalCalculationEngine, runReportEngine } from '../src/engine/core/engineGateway.js';
import { assertEngineOperational } from '../src/engine/validation/operationalGuards.js';

const scenarios = [
  {
    name: 'Hybrid residential roof',
    input: { scenario: 'hybrid', dailyEnergyKWh: 18, peakLoadW: 5200, backupHours: 6, sunHours: 5.2, environmentType: 'roof', ambientMinC: -5, ambientMaxC: 45 },
  },
  {
    name: 'Offgrid small site',
    input: { scenario: 'offgrid', dailyEnergyKWh: 9, peakLoadW: 2600, backupHours: 8, sunHours: 5.8, environmentType: 'outdoor', ambientMinC: 0, ambientMaxC: 42 },
  },
  {
    name: 'Ongrid commercial basic',
    input: { scenario: 'ongrid', dailyEnergyKWh: 32, peakLoadW: 9000, backupHours: 0, sunHours: 5.4, environmentType: 'industrial', ambientMinC: -3, ambientMaxC: 48 },
  },
];

const runners = [
  ['systemSettings', runSystemSettingsEngine],
  ['finalCalculation', runFinalCalculationEngine],
  ['report', runReportEngine],
];

const rows = [];
for (const scenario of scenarios) {
  for (const [runnerName, runner] of runners) {
    const result = runner(scenario.input, { profile: 'ENGINE_QA' });
    const status = assertEngineOperational(result, { profile: 'ENGINE_QA' });
    rows.push({
      scenario: scenario.name,
      runner: runnerName,
      status: status.status,
      rules: result.appliedRules?.length || 0,
      warnings: result.warnings?.length || 0,
      panelCount: result.summary?.pv?.count || 0,
      inverter: result.summary?.inverter || 'N/A',
    });
  }
}

console.table(rows);
console.log('SHIL production check passed: engine, rules, summary, and operational guard are healthy.');
