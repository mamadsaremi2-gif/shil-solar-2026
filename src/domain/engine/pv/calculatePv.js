function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

const MONTH_FACTORS = [0.72, 0.79, 0.9, 1.02, 1.08, 1.12, 1.1, 1.03, 0.94, 0.84, 0.75, 0.69];

function getTemperatureLoss(avgTemp, panelTypeTemperatureFactor) {
  const tempRise = Math.max(avgTemp - 25, 0);
  const pctLoss = (tempRise * panelTypeTemperatureFactor) / 100;
  return Math.max(0.75, 1 - pctLoss);
}

function chooseStringing(input, roughPanelCount) {
  const coldVocPerModule = input.panelVoc * (1 + input.panelTempCoeffVoc * Math.max(25 - input.minTemperature, 0));
  const minSeriesByMppt = Math.max(1, Math.ceil(input.mpptMinVoltage / Math.max(input.panelVmp, 1)));
  const maxSeriesByMppt = Math.max(minSeriesByMppt, Math.floor(input.mpptMaxVoltage / Math.max(input.panelVmp, 1)));
  const maxSeriesByVoc = Math.max(1, Math.floor((input.controllerMaxVoc * 0.95) / Math.max(coldVocPerModule, 1)));
  const maxSeries = Math.max(1, Math.min(maxSeriesByMppt, maxSeriesByVoc));
  const minSeries = Math.min(minSeriesByMppt, maxSeries);

  let best = null;
  for (let seriesCount = minSeries; seriesCount <= maxSeries; seriesCount += 1) {
    const parallelCount = Math.max(1, Math.ceil(roughPanelCount / seriesCount));
    const adjustedPanelCount = seriesCount * parallelCount;
    const stringVmp = input.panelVmp * seriesCount;
    const stringVocCold = coldVocPerModule * seriesCount;
    const mpptWindowOk = stringVmp >= input.mpptMinVoltage && stringVmp <= input.mpptMaxVoltage;
    const vocOk = stringVocCold < input.controllerMaxVoc;
    const waste = adjustedPanelCount - roughPanelCount;
    const candidate = { seriesCount, parallelCount, adjustedPanelCount, stringVmp, stringVocCold, mpptWindowOk, vocOk, waste };
    if (!best || candidate.waste < best.waste || (candidate.waste === best.waste && candidate.seriesCount > best.seriesCount)) {
      best = candidate;
    }
  }

  if (best) return best;

  const fallbackSeries = Math.max(1, Math.floor(Math.min(input.mpptMaxVoltage, input.controllerMaxVoc * 0.85) / Math.max(input.panelVmp, 1)));
  const parallelCount = Math.max(1, Math.ceil(roughPanelCount / fallbackSeries));
  const stringVmp = input.panelVmp * fallbackSeries;
  const stringVocCold = coldVocPerModule * fallbackSeries;
  return {
    seriesCount: fallbackSeries,
    parallelCount,
    adjustedPanelCount: fallbackSeries * parallelCount,
    stringVmp,
    stringVocCold,
    mpptWindowOk: stringVmp >= input.mpptMinVoltage && stringVmp <= input.mpptMaxVoltage,
    vocOk: stringVocCold < input.controllerMaxVoc,
    waste: fallbackSeries * parallelCount - roughPanelCount,
  };
}

function getEnergyTargetFactor(input) {
  if (input.systemType === "gridtie") return input.targetOffsetPercent / 100;
  if (input.systemType === "hybrid") {
    if (input.hybridMode === "backup_priority") return 0.95;
    if (input.hybridMode === "peak_shaving") return 0.65;
    return 0.8;
  }
  return 1;
}

export function calculatePv(input, loadResult, batteryResult) {
  if (input.systemType === "backup") return null;

  const temperatureLossFactor = getTemperatureLoss(input.averageTemperature, input.panelTypeTemperatureFactor);
  const altitudeFactor = input.altitude > 1500 ? 1.02 : 1;
  const tiltFactor = input.tiltAngle >= 20 && input.tiltAngle <= 35 ? 1 : 0.97;
  const performanceRatio = Math.max(0.45, Math.min(0.92,
    input.controllerEfficiency *
    input.cableLossFactor *
    input.panelLossFactor *
    input.shadingFactor *
    input.dustFactor *
    temperatureLossFactor *
    altitudeFactor *
    tiltFactor
  ));

  const energyTargetFactor = getEnergyTargetFactor(input);
  const targetEnergyWh = loadResult.totalDailyEnergyWh * energyTargetFactor;
  const batteryRechargeReserveWh = input.systemType === "offgrid"
    ? Math.max(loadResult.totalDailyEnergyWh * (input.daysAutonomy > 0 ? 1 : 0.05), 0)
    : input.systemType === "hybrid"
      ? Math.max(loadResult.totalDailyEnergyWh * (input.daysAutonomy > 0 ? 0.35 : 0.03), 0)
      : 0;
  const targetEnergyWithRechargeWh = targetEnergyWh + batteryRechargeReserveWh;
  const requiredPvEnergyWh = targetEnergyWithRechargeWh / Math.max(performanceRatio, 0.1);
  const requiredPvPowerW = requiredPvEnergyWh / Math.max(input.sunHours, 1);
  const pvDesignReserveFactor = input.pvDesignReserveFactor || (input.systemType === "offgrid" ? 1.1 : input.systemType === "hybrid" ? 1.08 : 1.03);
  const designPvPowerW = requiredPvPowerW * pvDesignReserveFactor;
  const roughPanelCount = Math.max(1, Math.ceil(designPvPowerW / input.panelWatt));
  const stringing = chooseStringing(input, roughPanelCount);
  const installedPvPowerW = stringing.adjustedPanelCount * input.panelWatt;
  const estimatedDailyProductionWh = installedPvPowerW * input.sunHours * performanceRatio;
  const worstMonthFactor = Math.min(...MONTH_FACTORS);
  const bestMonthFactor = Math.max(...MONTH_FACTORS);
  const worstMonthDailyProductionWh = estimatedDailyProductionWh * worstMonthFactor;
  const bestMonthDailyProductionWh = estimatedDailyProductionWh * bestMonthFactor;

  return {
    performanceRatio: round(performanceRatio, 3),
    temperatureLossFactor: round(temperatureLossFactor, 3),
    altitudeFactor: round(altitudeFactor, 3),
    tiltFactor: round(tiltFactor, 3),
    energyTargetFactor: round(energyTargetFactor, 2),
    targetEnergyWh: round(targetEnergyWh),
    batteryRechargeReserveWh: round(batteryRechargeReserveWh),
    targetEnergyWithRechargeWh: round(targetEnergyWithRechargeWh),
    requiredPvEnergyWh: round(requiredPvEnergyWh),
    requiredPvPowerW: round(requiredPvPowerW),
    designPvPowerW: round(designPvPowerW),
    appliedDesignFactor: round(pvDesignReserveFactor, 2),
    roughPanelCount,
    panelCount: stringing.adjustedPanelCount,
    panelSeriesCount: stringing.seriesCount,
    panelParallelCount: stringing.parallelCount,
    installedPvPowerW: round(installedPvPowerW),
    estimatedDailyProductionWh: round(estimatedDailyProductionWh),
    worstMonthDailyProductionWh: round(worstMonthDailyProductionWh),
    bestMonthDailyProductionWh: round(bestMonthDailyProductionWh),
    stringVmp: round(stringing.stringVmp),
    stringVocCold: round(stringing.stringVocCold),
    mpptWindowOk: stringing.mpptWindowOk,
    vocOk: stringing.vocOk,
    stringingWastePanels: stringing.waste,
  };
}
