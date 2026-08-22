import { runSystemSettingsEngine, runFinalCalculationEngine, runReportEngine } from '../src/engine/core/engineGateway.js';
import { ACTIVE_ENGINE_RULE_SEQUENCE, ruleRegistry } from '../src/engine/rules/index.js';

const required = [
  'validation', 'loadEstimation', 'inverterSelection', 'panelSelection', 'batterySelection',
  'stringDesign', 'pvThermal', 'mpptOptimizer', 'batteryAutonomy', 'voltage', 'environment',
  'protection', 'cable', 'dependency', 'resultSummary', 'exportReadiness',
];

for (const name of required) {
  if (!ACTIVE_ENGINE_RULE_SEQUENCE.includes(name)) throw new Error(`V18 QA: ${name} is not in active sequence`);
  if (!ruleRegistry[name] || typeof ruleRegistry[name].run !== 'function') throw new Error(`V18 QA: missing rule ${name}`);
}

const scenarios = [
  {
    name: 'Hybrid residential roof',
    input: { scenario: 'hybrid', dailyEnergyKWh: 18, peakLoadW: 5200, backupHours: 6, sunHours: 5.2, ambientMinC: -7, ambientMaxC: 46, environmentType: 'roof', dcDistanceM: 18, acDistanceM: 22, batteryDistanceM: 3, site: { lightningRisk: 'normal' } },
  },
  {
    name: 'Offgrid small site',
    input: { scenario: 'offgrid', dailyEnergyKWh: 10, peakLoadW: 3000, backupHours: 9, sunHours: 5.6, ambientMinC: 0, ambientMaxC: 43, environmentType: 'outdoor', dcDistanceM: 26, acDistanceM: 20, batteryDistanceM: 4, site: { lightningRisk: 'high' } },
  },
  {
    name: 'Ongrid commercial basic',
    input: { scenario: 'ongrid', dailyEnergyKWh: 42, peakLoadW: 12000, backupHours: 0, sunHours: 5.4, ambientMinC: -4, ambientMaxC: 49, environmentType: 'industrial', dcDistanceM: 38, acDistanceM: 35, batteryDistanceM: 0, site: { lightningRisk: 'normal' } },
  },
];

function assertFinal(result, label) {
  if (!result.ok) throw new Error(`${label}: engine returned not ok`);
  if ((result.appliedRules || []).length < required.length) throw new Error(`${label}: not all V18 rules applied`);
  const summary = result.summary || {};
  if (!summary.exportPayload) throw new Error(`${label}: export payload missing`);
  if (!summary.billOfMaterials?.protection?.length) throw new Error(`${label}: protection BOM missing`);
  if (!summary.billOfMaterials?.cables?.items?.length) throw new Error(`${label}: cable BOM missing`);
  if (!summary.pv?.thermal) throw new Error(`${label}: thermal PV data missing`);
  if (!Array.isArray(summary.pv?.mpptAllocation)) throw new Error(`${label}: MPPT allocation missing`);
  if (!summary.battery || typeof summary.battery !== 'object') throw new Error(`${label}: battery summary missing`);
  if (!summary.resultFields?.operationalStatus) throw new Error(`${label}: operational status missing`);
}

const runners = [['systemSettings', runSystemSettingsEngine], ['finalCalculation', runFinalCalculationEngine], ['report', runReportEngine]];
const rows = [];
for (const scenario of scenarios) {
  for (const [runnerName, runner] of runners) {
    const result = runner(scenario.input, { profile: 'V18_FINAL_QA' });
    assertFinal(result, `${scenario.name}/${runnerName}`);
    rows.push({
      scenario: scenario.name,
      runner: runnerName,
      status: result.summary.operationalStatus || result.values.operationalStatus,
      rules: result.appliedRules.length,
      warnings: result.warnings.length,
      panels: result.summary.resultFields.panelCount,
      inverters: result.summary.resultFields.inverterCount,
      mppt: result.summary.resultFields.mpptCount,
      pvMargin: result.summary.resultFields.pvVoltageSafetyMarginPct,
      exportReady: result.summary.exportReady,
    });
  }
}
console.table(rows);
console.log('SHIL V18 final QA passed: full engineering rule sequence, bank binding, MPPT, thermal PV, protection, cable, summary, and export payload are ready.');
