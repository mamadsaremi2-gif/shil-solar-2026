import { runSystemSettingsEngine, runFinalCalculationEngine } from '../src/engine/core/engineGateway.js';
import { ruleRegistry, ACTIVE_ENGINE_RULE_SEQUENCE } from '../src/engine/rules/index.js';

const requiredActiveRules = ['voltage', 'environment', 'protection', 'cable', 'dependency', 'resultSummary'];
for (const name of requiredActiveRules) {
  const rule = ruleRegistry[name];
  if (!rule || typeof rule.run !== 'function') {
    throw new Error(`v17 QA: active rule is missing: ${name}`);
  }
  if (String(rule.title || '').includes('disabled') || rule.enabled === false) {
    throw new Error(`v17 QA: rule ${name} is disabled or shadowed by a legacy placeholder`);
  }
}

const scenarios = [
  {
    name: 'Hybrid roof 48V',
    input: {
      scenario: 'hybrid',
      dailyEnergyKWh: 18,
      peakLoadW: 5200,
      backupHours: 6,
      sunHours: 5.2,
      environmentType: 'roof',
      ambientMinC: -5,
      ambientMaxC: 45,
      dcDistanceM: 18,
      acDistanceM: 22,
      batteryDistanceM: 3,
      site: { lightningRisk: 'normal' },
    },
  },
  {
    name: 'Offgrid outdoor 48V',
    input: {
      scenario: 'offgrid',
      dailyEnergyKWh: 11,
      peakLoadW: 3200,
      backupHours: 8,
      sunHours: 5.8,
      environmentType: 'outdoor',
      ambientMinC: 0,
      ambientMaxC: 42,
      dcDistanceM: 25,
      acDistanceM: 18,
      batteryDistanceM: 4,
      site: { lightningRisk: 'high' },
    },
  },
  {
    name: 'Commercial ongrid base',
    input: {
      scenario: 'ongrid',
      dailyEnergyKWh: 35,
      peakLoadW: 9000,
      backupHours: 0,
      sunHours: 5.4,
      environmentType: 'industrial',
      ambientMinC: -3,
      ambientMaxC: 48,
      dcDistanceM: 35,
      acDistanceM: 35,
      site: { lightningRisk: 'normal' },
    },
  },
];

function assertBound(result, label) {
  const summary = result.summary || {};
  const rb = summary.registryBinding || {};
  const missing = ['panels', 'inverters', 'batteries', 'protection', 'cables', 'dependencies'].filter((key) => rb[key] !== true);
  if (missing.length) throw new Error(`${label}: registry binding missing: ${missing.join(', ')}`);
  if (!summary.billOfMaterials?.protection?.length) throw new Error(`${label}: protection BOM not generated`);
  if (!summary.billOfMaterials?.cables?.items?.length) throw new Error(`${label}: cable BOM not generated`);
  if (!Array.isArray(summary.distributedInverterSystems) || summary.distributedInverterSystems.length < 1) {
    throw new Error(`${label}: distributed inverter systems not generated`);
  }
  if (!summary.resultFields || !summary.resultFields.panelCount) throw new Error(`${label}: result fields incomplete`);
  if ((result.appliedRules || []).length < ACTIVE_ENGINE_RULE_SEQUENCE.length) {
    throw new Error(`${label}: not all active rules were applied`);
  }
}

const rows = [];
for (const scenario of scenarios) {
  for (const [runnerName, runner] of [['systemSettings', runSystemSettingsEngine], ['finalCalculation', runFinalCalculationEngine]]) {
    const result = runner(scenario.input, { profile: 'ENGINE_QA_V17' });
    assertBound(result, `${scenario.name}/${runnerName}`);
    rows.push({
      scenario: scenario.name,
      runner: runnerName,
      rules: result.appliedRules.length,
      warnings: result.warnings.length,
      panelCount: result.summary.pv.count,
      inverterCount: result.summary.resultFields.inverterCount,
      mpptCount: result.summary.resultFields.mpptCount,
      readiness: result.summary.readiness,
    });
  }
}

console.table(rows);
console.log('SHIL v17 QA passed: active rules are not shadowed, banks are bound, and result renderer data is complete.');
