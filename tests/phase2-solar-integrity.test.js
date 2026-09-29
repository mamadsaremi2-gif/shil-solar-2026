import assert from 'node:assert/strict';
import { buildSolarSystemDesign } from '../src/engineering/solar/solarDesignEngine.js';
import { SHIL_SOLAR_PANELS, SHIL_SOLAR_INVERTERS, SHIL_LITHIUM_BATTERIES } from '../src/engineering/bank/equipmentBank.js';

const handoff = {
  source: { domain: 'solar', method: 'power', scenario: 'offgrid' },
  normalizedLoad: {
    totalPowerW: 5000,
    dailyEnergyKWh: 25,
    voltageAC: 220,
    currentA: 22.73,
    surgePowerW: 5000,
  },
  methodSummary: { basis: 'total_power', title: 'توان کل' },
  routePayload: { type: 'power', manualPowerW: 5000, manualHours: 5 },
  environmentSnapshot: { peakSunHours: 5.7, effectiveEfficiency: 0.92, minTemperatureC: 0 },
  autonomy: { days: 1, hours: 0 },
  systemHints: { needsBattery: true },
};

const design = buildSolarSystemDesign({
  handoff,
  settings: {
    systemType: 'offgrid',
    designAdjustmentMode: 'decrease',
    designAdjustmentPercent: 20,
    autonomyDays: 1,
    autonomyHours: 0,
  },
  banks: {
    panels: SHIL_SOLAR_PANELS,
    inverters: SHIL_SOLAR_INVERTERS,
    batteries: SHIL_LITHIUM_BATTERIES,
  },
});

assert.equal(design.load.basePowerW, 5000, 'load power must stay 5000 W');
assert.equal(design.load.finalEnergyKWh, 25, 'daily load energy must stay 25 kWh and must not be replaced by PSH');
assert.ok(design.inverter.ratedPowerW * design.inverter.count >= 5000, 'inverter installed power must cover load');
assert.equal(design.pvArray.arrayPowerW, design.pvArray.panelCount * design.panel.powerW, 'installed PV power must equal panel count x panel power');
assert.ok(design.pvArray.seriesCount >= 2, 'string voltage must not use an invalid one-panel series string');
assert.equal(design.compatibility.pvInverter.compatible, true, 'PV string must be MPPT compatible');
assert.ok(design.battery.usableEnergyKWh >= design.battery.requiredUsableEnergyKWh, 'usable battery energy must cover requested autonomy');
assert.equal(design.valid, true, 'reference 5 kW scenario should be valid');

console.log('phase2-solar-integrity.test passed');
