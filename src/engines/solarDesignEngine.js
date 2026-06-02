import {
  batteryVoltageClass,
  checkPvInverterCompatibility,
  findById,
  nearestByMinPower,
  number,
  positive,
  selectCompatibleBattery,
} from "./solarBankRules.js";

function resolveMethodSummary(handoff = {}) {
  return handoff.methodSummary || handoff.summary || handoff.routePayload?.methodSummary || null;
}

function resolveLoad(handoff = {}) {
  const normalized = handoff.normalizedLoad || {};
  const engine = handoff.engineResult || {};
  return {
    method: handoff.source?.method || normalized.method || engine.method || "equipment",
    totalPowerW: positive(normalized.totalPowerW, positive(engine.totalPowerW, positive(engine.recommendedInverterW, 0))),
    dailyEnergyKWh: positive(normalized.dailyEnergyKWh, positive(normalized.totalEnergyKWh, positive(engine.totalEnergyKWh, positive(engine.totalEnergyWh, 0) / 1000))),
    surgePowerW: positive(normalized.surgePowerW, positive(engine.surgePowerW, 0)),
    voltageAC: positive(normalized.voltageAC, positive(engine.voltageAC, 220)),
    phaseAC: normalized.phaseAC || engine.phaseAC || (positive(normalized.voltageAC, 220) >= 380 ? "three" : "single"),
  };
}

function resolveAutonomy(handoff = {}, settings = {}) {
  const autonomy = handoff.autonomy || handoff.systemHints?.autonomy || {};
  const hours = positive(settings.autonomyHours, positive(autonomy.hours, positive(autonomy.backupHours, 0)));
  const days = positive(settings.autonomyDays, positive(autonomy.days, hours > 0 ? hours / 24 : 0));
  return { hours, days };
}

export function buildSolarSystemDesign({ handoff = {}, settings = {}, banks = {} }) {
  const panels = banks.panels || [];
  const inverters = banks.inverters || [];
  const batteries = banks.batteries || [];
  const load = resolveLoad(handoff);
  const methodSummary = resolveMethodSummary(handoff);
  const routePayload = handoff.routePayload || {};
  const environment = handoff.environmentSnapshot || handoff.environment || {};
  const reserveFactor = Math.max(1, number(settings.reserveFactor, 1.2));
  const systemType = settings.systemType || (handoff.source?.scenario || "offgrid");
  const autonomy = resolveAutonomy(handoff, settings);
  const psh = positive(environment.peakSunHours || environment.psh || routePayload.psh, 5);
  const lossRatio = Math.min(0.45, Math.max(0, number(environment.lossRatio ?? routePayload.lossRatio, 0.18)));
  const efficiency = Math.max(0.5, Math.min(1, 1 - lossRatio));
  const needsBattery = Boolean(
    handoff.systemHints?.needsBattery === true ||
    systemType === "offgrid" ||
    systemType === "hybrid" ||
    autonomy.hours > 0 ||
    autonomy.days > 0
  );

  const basePowerW = methodSummary?.basis === "pv_generation"
    ? positive(routePayload.totalPanelPowerW || routePayload.effectivePanelPowerW, load.totalPowerW)
    : load.totalPowerW;
  const finalPowerW = Math.ceil(basePowerW * reserveFactor);
  const baseEnergyKWh = methodSummary?.basis === "pv_generation"
    ? positive(routePayload.generatedDailyKWh || routePayload.usableDailyEnergyKWh, load.dailyEnergyKWh)
    : load.dailyEnergyKWh;
  const finalEnergyKWh = Math.round(baseEnergyKWh * reserveFactor * 100) / 100;

  const preferredPanel = findById(panels, settings.panelId || routePayload.panelId || routePayload.selectedPanelId) || nearestByMinPower(panels, positive(routePayload.panelPowerW, 550)) || panels[0] || null;
  const panelPowerW = positive(preferredPanel?.powerW, 550);
  const panelCount = methodSummary?.basis === "pv_generation" && positive(routePayload.panelCount, 0) > 0
    ? positive(routePayload.panelCount, 1)
    : Math.max(1, Math.ceil((finalEnergyKWh * 1000) / Math.max(1, psh * panelPowerW * efficiency)), Math.ceil(finalPowerW / Math.max(1, panelPowerW)));
  const arrayPowerW = panelCount * panelPowerW;

  const preferredInverter = findById(inverters, settings.inverterId) || nearestByMinPower(inverters, finalPowerW || arrayPowerW) || inverters[0] || null;
  const inverterRatedW = positive(preferredInverter?.ratedPowerW, finalPowerW || 5000);
  const inverterCount = Math.max(1, Math.ceil(finalPowerW / Math.max(1, inverterRatedW)));
  const inverterDcVoltage = batteryVoltageClass(preferredInverter?.batteryVoltage || preferredInverter?.dcVoltage || 48);

  const selectedBattery = selectCompatibleBattery(batteries, preferredInverter || {}, settings.batteryId);
  const unitBatteryKWh = selectedBattery ? positive(selectedBattery.energyWh, positive(selectedBattery.nominalVoltage, 48) * positive(selectedBattery.capacityAh, 100)) / 1000 : 0;
  const requiredBatteryKWh = needsBattery ? Math.round(finalEnergyKWh * Math.max(autonomy.days, autonomy.hours / 24) * 100) / 100 : 0;
  const batteryCount = needsBattery && unitBatteryKWh > 0 ? Math.max(1, Math.ceil(requiredBatteryKWh / unitBatteryKWh)) : 0;

  const panelVmp = positive(preferredPanel?.vmp, 40);
  const minMpptV = positive(preferredInverter?.mpptMinV || preferredInverter?.mpptMinVoltage, 60);
  const seriesCount = Math.max(1, Math.ceil(minMpptV / panelVmp));
  const parallelCount = Math.max(1, Math.ceil(panelCount / seriesCount));
  const pvCompatibility = checkPvInverterCompatibility(preferredPanel || {}, preferredInverter || {}, seriesCount, parallelCount, positive(environment.minTemperatureC, 0));
  const warnings = [
    ...(pvCompatibility.issues || []).map((issue) => issue.message),
    ...(needsBattery && !selectedBattery ? ["باتری برای این مسیر الزامی است اما بانک باتری سازگار پیدا نشد."] : []),
  ];

  return {
    version: 3,
    source: handoff.source || {},
    methodSummary,
    handoff,
    valid: !pvCompatibility.issues?.some((issue) => issue.severity === "error") && (!needsBattery || Boolean(selectedBattery)),
    load: {
      ...load,
      basePowerW,
      finalPowerW,
      baseEnergyKWh,
      finalEnergyKWh,
      reserveFactor,
    },
    system: {
      systemType,
      needsBattery,
      autonomy,
      psh,
      efficiency,
    },
    panel: preferredPanel,
    inverter: { ...(preferredInverter || {}), count: inverterCount, dcVoltage: inverterDcVoltage },
    battery: selectedBattery ? {
      item: selectedBattery,
      count: batteryCount,
      unitEnergyKWh: Math.round(unitBatteryKWh * 100) / 100,
      requiredEnergyKWh: requiredBatteryKWh,
      grossEnergyKWh: Math.round(unitBatteryKWh * batteryCount * 100) / 100,
    } : null,
    pvArray: {
      panelCount,
      arrayPowerW,
      arrayPowerKW: Math.round(arrayPowerW / 10) / 100,
      seriesCount,
      parallelCount,
      estimatedDailyKWh: Math.round((arrayPowerW / 1000) * psh * efficiency * 100) / 100,
    },
    compatibility: { pvInverter: pvCompatibility },
    warnings,
    selectedBanks: {
      panelId: preferredPanel?.id || null,
      inverterId: preferredInverter?.id || null,
      batteryId: selectedBattery?.id || null,
    },
  };
}
