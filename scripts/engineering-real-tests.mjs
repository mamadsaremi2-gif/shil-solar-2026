import assert from 'node:assert/strict';
import { runEngineeringDesign } from '../src/domain/engine/orchestrator/runEngineeringDesign.js';

const EPS = 0.02;

function approx(actual, expected, toleranceRatio = EPS, message = 'value is out of tolerance') {
  const tolerance = Math.max(Math.abs(expected) * toleranceRatio, 0.5);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}, tolerance ${tolerance}`);
}

function ceilToStep(value, step) {
  return Math.ceil(value / step) * step;
}

function hasAdvisor(engineResult, fragment) {
  return engineResult.advisor.some((item) => `${item.title} ${item.message}`.includes(fragment));
}

function runCase(name, form) {
  const result = runEngineeringDesign(form);
  assert.equal(result.ok, true, `${name} validation failed: ${JSON.stringify(result.errors)}`);
  return result;
}

const commonPv = {
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

// Case 1: 5 kWh/day off-grid villa, 2 autonomy days, LFP bank.
{
  const form = {
    ...commonPv,
    projectTitle: 'REAL-01 Off-grid villa 5kWh/day',
    systemType: 'offgrid',
    calculationMode: 'daily_energy',
    dailyEnergyKwh: 5,
    backupHours: 5,
    systemVoltage: 24,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 2,
  };
  const { result } = runCase('REAL-01', form);
  const { summary, battery, pv, inverter, controller, cabling } = result;

  assert.equal(summary.totalDailyEnergyWh, 5000, 'daily energy must equal 5kWh');
  assert.equal(summary.demandPowerW, 1000, 'demand power must be daily energy / backup hours');

  const dischargeEfficiency = Math.sqrt(form.batteryRoundTripEfficiency);
  const requiredAh = (5000 * form.daysAutonomy * 1.1) / (form.systemVoltage * form.dod * form.inverterEfficiency * form.cableLossFactor * dischargeEfficiency);
  approx(battery.requiredBatteryAh, requiredAh, 0.01, 'battery Ah formula mismatch');
  assert.equal(battery.seriesCount, 2, '24V bank using 12V batteries must have 2 in series');
  assert.equal(battery.parallelCount, 4, 'required Ah must round to four 200Ah strings');
  assert.equal(battery.totalCount, 8, 'total battery count must be 8');
  assert.ok(summary.batteryAutonomyDays >= 2, 'usable autonomy must cover requested 2 days');

  approx(pv.performanceRatio, 0.745, 0.01, 'PV performance ratio mismatch');
  assert.equal(pv.roughPanelCount, 5, 'PV rough panel count should include balanced autonomy recharge reserve');
  assert.equal(pv.panelCount, 6, 'PV installed panel count should align with MPPT stringing');
  assert.equal(pv.panelSeriesCount, 3, 'stringing should use 3 panels in series');
  assert.equal(pv.panelParallelCount, 2, 'stringing should use two parallel strings for balanced autonomy recharge');
  assert.ok(pv.stringVmp >= form.mpptMinVoltage && pv.stringVmp <= form.mpptMaxVoltage, 'string Vmp must be inside MPPT window');
  assert.ok(pv.stringVocCold < form.controllerMaxVoc, 'cold Voc must stay below controller limit');

  assert.equal(inverter.continuousPowerW, ceilToStep(1000 * form.designFactor * 1.1, 100), 'inverter continuous W must include design reserve');
  assert.ok(inverter.surgePowerW >= inverter.continuousPowerW * 1.2, 'surge capacity must include minimum margin');
  assert.ok(controller.selectedCurrentA >= controller.requiredCurrentA, 'controller selected current must cover PV current');
  assert.ok(cabling.batteryVoltageDropPercent <= form.batteryVoltageDropLimit, 'battery cable voltage drop must be within limit');
}

// Case 2: Motor-load case; surge and VA sizing must be governed by motor startup.
{
  const form = {
    ...commonPv,
    projectTitle: 'REAL-02 Motor surge load',
    systemType: 'offgrid',
    calculationMode: 'loads',
    systemVoltage: 48,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 2,
    loadItems: [
      { name: 'پمپ', qty: 1, power: 1500, hours: 2, powerFactor: 0.82, coincidenceFactor: 1, surgeFactor: 3.5, loadType: 'motor' },
      { name: 'روشنایی', qty: 10, power: 20, hours: 6, powerFactor: 0.95, coincidenceFactor: 1, surgeFactor: 1, loadType: 'resistive' },
    ],
  };
  const { result } = runCase('REAL-02', form);
  const { loads, inverter, battery } = result;

  assert.equal(loads.demandPowerW, 1700, 'connected demand must include pump and lighting');
  assert.equal(loads.totalDailyEnergyWh, 4200, 'daily Wh must include demand*hours per load');
  assert.ok(loads.surgePowerW >= 5450, 'motor surge must dominate peak power');
  assert.ok(inverter.surgePowerW >= loads.surgePowerW, 'inverter surge W must cover motor startup');
  assert.ok(inverter.surgePowerVA >= loads.surgeApparentVA, 'inverter surge VA must cover low PF motor startup');
  assert.equal(battery.dischargeCRate < battery.recommendedDischargeC, true, 'battery C-rate should be safe for LFP');
  assert.ok(hasAdvisor(result, 'ضریب توان پایین'), 'low power factor advisor warning must be present');
}

// Case 3: Cold-temperature stringing must not violate controller Voc and must warn on MPPT mismatch.
{
  const form = {
    ...commonPv,
    projectTitle: 'REAL-03 Cold MPPT boundary',
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
  };
  const { result } = runCase('REAL-03', form);
  const { pv, summary } = result;

  assert.ok(pv.stringVocCold < form.controllerMaxVoc, 'string optimizer must keep cold Voc below max input voltage');
  assert.equal(pv.mpptWindowOk, false, 'this scenario intentionally forces an MPPT-window warning');
  assert.equal(summary.designStatus, 'warning', 'MPPT-window mismatch must degrade design status to warning');
  assert.ok(hasAdvisor(result, 'MPPT'), 'advisor must mention MPPT mismatch');
}

// Case 4: Backup-only inverter/battery design must not add PV or controller equipment.
{
  const form = {
    ...commonPv,
    projectTitle: 'REAL-04 Backup-only sanverter',
    systemType: 'backup',
    calculationMode: 'power',
    loadPower: 1200,
    backupHours: 4,
    systemVoltage: 24,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 1,
  };
  const { result } = runCase('REAL-04', form);
  const { summary, battery, pv, controller, cabling } = result;

  assert.equal(pv, null, 'backup-only design must not create PV design');
  assert.equal(controller, null, 'backup-only design must not create charge controller');
  assert.equal(summary.panelCount, 0, 'backup-only panel count must be zero');
  assert.equal(summary.controllerCount, 0, 'backup-only controller count must be zero');
  assert.ok(battery.realBackupHours >= form.backupHours, 'backup battery must cover requested hours');
  assert.equal(battery.seriesCount, 2, '24V backup bank using 12V batteries must be 2S');
  assert.equal(battery.parallelCount, 2, '1200W for 4h must round to two parallel 200Ah strings');
  assert.equal(cabling.dcCableSizeMm2, 0, 'backup-only system must not size PV DC cable');
}

// Case 5: Grid-tie offset case must have PV, no battery bank, and no battery cable/fuse loadout beyond zeroed battery result.
{
  const form = {
    ...commonPv,
    projectTitle: 'REAL-05 Grid-tie 80 percent offset',
    systemType: 'gridtie',
    calculationMode: 'daily_energy',
    dailyEnergyKwh: 12,
    backupHours: 6,
    systemVoltage: 48,
    batteryUnitVoltage: 12,
    batteryUnitAh: 200,
    daysAutonomy: 1,
    targetOffsetPercent: 80,
  };
  const { result } = runCase('REAL-05', form);
  const { summary, battery, pv } = result;

  assert.equal(battery.totalCount, 0, 'grid-tie design must not require a battery bank');
  assert.equal(summary.batteryCount, 0, 'grid-tie summary battery count must be zero');
  assert.ok(pv.panelCount > 0, 'grid-tie offset design must include panels');
  approx(pv.energyTargetFactor, 0.8, 0.001, 'grid-tie energy target factor must follow offset percent');
  assert.ok(pv.estimatedDailyProductionWh >= 12_000 * 0.8, 'PV daily production must cover target offset');
}

console.log('Real engineering calculation tests passed');
