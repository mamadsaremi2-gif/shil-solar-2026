import assert from 'node:assert/strict';
import { runEngineeringDesign } from '../src/domain/engine/orchestrator/runEngineeringDesign.js';

function runCase(name, form) {
  const output = runEngineeringDesign(form);
  assert.equal(output.ok, true, `${name} input validation failed: ${JSON.stringify(output.errors)}`);
  assert.ok(output.result.validation, `${name} must include validation output`);
  assert.ok(Array.isArray(output.result.validation.checks), `${name} validation checks must be an array`);
  return output.result;
}

function hasValidationCheck(result, id) {
  return result.validation.checks.some((item) => item.id === id);
}

const common = {
  loadVoltage: 220,
  powerFactor: 0.9,
  batteryType: 'LFP',
  batteryRoundTripEfficiency: 0.95,
  dod: 0.8,
  inverterEfficiency: 0.93,
  cableLossFactor: 0.97,
  controllerEfficiency: 0.95,
  panelLossFactor: 0.9,
  shadingFactor: 0.95,
  dustFactor: 0.96,
  averageTemperature: 30,
  minTemperature: 0,
  maxTemperature: 45,
  sunHours: 5,
  panelWatt: 550,
  panelVoc: 49.9,
  panelVmp: 41.8,
  panelTempCoeffVoc: 0.0028,
  panelTypeTemperatureFactor: 0.29,
  controllerMaxVoc: 250,
  mpptMinVoltage: 100,
  mpptMaxVoltage: 200,
  designFactor: 1.2,
  dcCableLength: 20,
  batteryCableLength: 2,
  acCableLength: 20,
  dcVoltageDropLimit: 3,
  batteryVoltageDropLimit: 2,
  acVoltageDropLimit: 3,
};

// Safe design: validation object must be present and score must be usable by UI/reporting.
{
  const result = runCase('VALIDATION-01 safe villa', {
    ...common,
    projectTitle: 'VALIDATION-01 Safe off-grid villa',
    systemType: 'offgrid',
    calculationMode: 'daily_energy',
    dailyEnergyKwh: 5,
    backupHours: 5,
    systemVoltage: 24,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 2,
  });
  assert.ok(result.validation.summary.score >= 60, 'safe villa design must not be scored as unusable');
  assert.ok(['excellent', 'acceptable'].includes(result.validation.summary.grade), 'safe villa must be excellent or acceptable');
  assert.equal(result.summary.validationScore, result.validation.summary.score, 'summary must expose validation score');
}

// MPPT/Voc boundary: dynamic validation must flag PV stringing risk without crashing.
{
  const result = runCase('VALIDATION-02 MPPT boundary', {
    ...common,
    projectTitle: 'VALIDATION-02 Cold MPPT boundary',
    systemType: 'offgrid',
    calculationMode: 'daily_energy',
    dailyEnergyKwh: 5,
    backupHours: 5,
    systemVoltage: 24,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 2,
    minTemperature: -20,
    controllerMaxVoc: 150,
    mpptMinVoltage: 120,
    mpptMaxVoltage: 180,
  });
  assert.ok(hasValidationCheck(result, 'pv-mppt-window'), 'MPPT boundary case must add pv-mppt-window check');
  assert.ok(result.validation.summary.counts.warning >= 1, 'MPPT boundary case must contain warning count');
  assert.equal(result.summary.designStatus, 'warning', 'validation warning must affect design status');
}

// High power with tiny backup time: energy sizing may pass, but validation must catch dangerous C-rate.
{
  const result = runCase('VALIDATION-03 battery C-rate error', {
    ...common,
    projectTitle: 'VALIDATION-03 High C-rate backup',
    systemType: 'backup',
    calculationMode: 'power',
    loadPower: 5000,
    backupHours: 0.2,
    systemVoltage: 12,
    batteryType: 'AGM',
    batteryRoundTripEfficiency: 0.85,
    dod: 0.6,
    batteryUnitVoltage: 12,
    batteryUnitAh: 50,
    daysAutonomy: 1,
  });
  assert.ok(hasValidationCheck(result, 'battery-discharge-c-rate'), 'high C-rate case must create battery-discharge-c-rate error');
  assert.ok(result.validation.summary.counts.error >= 1, 'high C-rate case must contain validation error');
  assert.equal(result.validation.summary.grade, 'risky', 'high C-rate case must be graded risky');
  assert.equal(result.summary.designStatus, 'error', 'validation error must affect design status');
}

console.log('Engineering validation tests passed');
