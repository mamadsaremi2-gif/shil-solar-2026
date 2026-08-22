import { positiveNumber, toNumber } from './number.js';

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeScenario(value) {
  const v = lower(value);
  if (['offgrid', 'off-grid', 'آفگرید', 'آف گرید'].includes(v)) return 'offgrid';
  if (['hybrid', 'هیبرید'].includes(v)) return 'hybrid';
  if (['ongrid', 'on-grid', 'آنگرید', 'آن گرید'].includes(v)) return 'ongrid';
  if (v.includes('hybrid') || v.includes('هیبرید')) return 'hybrid';
  if (v.includes('on') || v.includes('grid') || v.includes('آنگرید')) return 'ongrid';
  return v || 'offgrid';
}

export function normalizeEngineeringInput(input = {}) {
  const project = input.project || input.projectState || input;
  const form = project.form || input.form || {};
  const projectInfo = form.projectInfo || input.projectInfo || {};
  const systemSettings = form.systemSettings || input.systemSettings || project.systemSettings || {};
  const calculationInputs = form.calculationInputs || input.calculationInputs || project.calculationInputs || {};
  const environment = form.environment || input.environment || project.environment || {};
  const equipment = input.equipment || project.equipment || {};

  const scenario = normalizeScenario(pick(
    project.scenario,
    project.connectionType,
    project.path,
    systemSettings.scenario,
    systemSettings.connectionType,
    calculationInputs.scenario,
    input.scenario,
  ));

  const dailyEnergyWh = positiveNumber(pick(
    project.dailyEnergyWh,
    calculationInputs.dailyEnergyWh,
    calculationInputs.energyWh,
    calculationInputs.dailyConsumptionWh,
    systemSettings.dailyEnergyWh,
    input.dailyEnergyWh,
    input.project?.dailyEnergyWh,
  ), 0);

  const dailyEnergyKWh = dailyEnergyWh > 0
    ? dailyEnergyWh / 1000
    : positiveNumber(pick(
        project.dailyEnergyKWh,
        calculationInputs.dailyEnergyKWh,
        calculationInputs.energyKWh,
        calculationInputs.dailyConsumptionKWh,
        systemSettings.dailyEnergyKWh,
        input.dailyEnergyKWh,
      ), 0);

  const peakLoadW = positiveNumber(pick(
    project.peakLoadW,
    calculationInputs.peakLoadW,
    calculationInputs.loadW,
    calculationInputs.maxLoadW,
    systemSettings.peakLoadW,
    input.peakLoadW,
    input.project?.peakLoadW,
  ), 0);

  const backupHours = positiveNumber(pick(
    project.backupHours,
    calculationInputs.backupHours,
    calculationInputs.operationHours,
    project.backupHours,
    project.operationHours,
    systemSettings.backupHours,
    input.backupHours,
  ), scenario === 'ongrid' ? 0 : 4);

  const sunHours = positiveNumber(pick(
    environment.sunHours,
    environment.peakSunHours,
    environment.psh,
    calculationInputs.sunHours,
    systemSettings.sunHours,
    input.sunHours,
  ), 5);

  const autonomyDays = positiveNumber(pick(
    calculationInputs.autonomyDays,
    systemSettings.autonomyDays,
    input.autonomyDays,
  ), 1);

  const dcDistanceM = positiveNumber(pick(systemSettings.dcDistanceM, calculationInputs.dcDistanceM, input.dcDistanceM), 15);
  const acDistanceM = positiveNumber(pick(systemSettings.acDistanceM, calculationInputs.acDistanceM, input.acDistanceM), 20);
  const batteryDistanceM = positiveNumber(pick(systemSettings.batteryDistanceM, calculationInputs.batteryDistanceM, input.batteryDistanceM), 3);

  return {
    raw: input,
    project,
    form,
    projectInfo,
    systemSettings,
    calculationInputs,
    environment,
    equipment,
    scenario,
    dailyEnergyWh: Math.round(dailyEnergyKWh * 1000),
    dailyEnergyKWh,
    peakLoadW,
    backupHours,
    sunHours,
    autonomyDays,
    dcDistanceM,
    acDistanceM,
    batteryDistanceM,
    selected: {
      panelId: pick(equipment.panelId, equipment.selected?.panelId, systemSettings.panelId, input.panelId),
      inverterId: pick(equipment.inverterId, equipment.selected?.inverterId, systemSettings.inverterId, input.inverterId),
      batteryId: pick(equipment.batteryId, equipment.selected?.batteryId, systemSettings.batteryId, input.batteryId),
    },
    environmentType: pick(environment.type, environment.environmentType, systemSettings.environmentType, input.environmentType, 'roof'),
    ambientMinC: toNumber(pick(environment.minTempC, environment.temperatureMinC, environment.ambientMinC, systemSettings.ambientMinC, input.ambientMinC), -10),
    ambientMaxC: toNumber(pick(environment.maxTempC, environment.temperatureMaxC, environment.ambientMaxC, systemSettings.ambientMaxC, input.ambientMaxC), 45),
  };
}
