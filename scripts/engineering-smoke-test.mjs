import assert from 'node:assert/strict';
import { runEngineeringDesign } from '../src/domain/engine/orchestrator/runEngineeringDesign.js';

const base = {
  projectTitle: 'Engineering smoke test',
  systemType: 'offgrid',
  calculationMode: 'loads',
  loadVoltage: 220,
  systemVoltage: 48,
  batteryUnitVoltage: 12,
  batteryUnitAh: 200,
  batteryChemistry: 'lead_acid',
  backupHours: 6,
  daysAutonomy: 1,
  dod: 0.5,
  sunHours: 5,
  panelWatt: 585,
  panelVoc: 53.1,
  panelVmp: 44.8,
  controllerMaxVoc: 250,
  mpptMinVoltage: 120,
  mpptMaxVoltage: 220,
  loadItems: [
    { name: 'روشنایی', qty: 8, power: 20, hours: 6, powerFactor: 0.95, coincidenceFactor: 1, surgeFactor: 1, loadType: 'resistive' },
    { name: 'پمپ', qty: 1, power: 750, hours: 2, powerFactor: 0.82, coincidenceFactor: 0.8, surgeFactor: 3, loadType: 'motor' }
  ]
};

const result = runEngineeringDesign(base);
assert.equal(result.ok, true, JSON.stringify(result.errors));
assert.ok(result.result.summary.totalDailyEnergyWh > 0, 'daily energy should be positive');
assert.ok(result.result.summary.inverterPowerW >= result.result.summary.demandPowerW, 'inverter must cover demand');
assert.ok(result.result.summary.panelCount > 0, 'offgrid design must include panels');
assert.ok(result.result.summary.batteryCount > 0, 'offgrid design must include batteries');
assert.ok(Array.isArray(result.result.advisor), 'advisor messages must be an array');

const backup = runEngineeringDesign({ ...base, systemType: 'backup', calculationMode: 'direct', loadPower: 1200, backupHours: 4 });
assert.equal(backup.ok, true, JSON.stringify(backup.errors));
assert.equal(backup.result.summary.panelCount, 0, 'backup-only design should not require PV panels');
assert.ok(backup.result.summary.batteryCount > 0, 'backup design must include batteries');

console.log('Engineering smoke tests passed');
