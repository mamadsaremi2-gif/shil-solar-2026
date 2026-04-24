function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getTemperatureLoss(avgTemp, panelTypeTemperatureFactor) {
  const tempRise = Math.max(avgTemp - 25, 0);
  const pctLoss = (tempRise * panelTypeTemperatureFactor) / 100;
  return Math.max(0.75, 1 - pctLoss);
}

export function calculatePv(input, loadResult, batteryResult) {
  if (input.systemType === "backup") return null;

  const temperatureLossFactor = getTemperatureLoss(input.averageTemperature, input.panelTypeTemperatureFactor);
  const altitudeFactor = input.altitude > 1500 ? 1.02 : 1;
  const tiltFactor = input.tiltAngle >= 20 && input.tiltAngle <= 35 ? 1 : 0.97;
  const performanceRatio =
    input.controllerEfficiency *
    input.cableLossFactor *
    input.panelLossFactor *
    input.shadingFactor *
    input.dustFactor *
    temperatureLossFactor *
    altitudeFactor *
    tiltFactor;

  const energyTargetFactor = input.systemType === "gridtie"
    ? input.targetOffsetPercent / 100
    : input.systemType === "hybrid"
      ? input.hybridMode === "backup_priority"
        ? 0.95
        : input.hybridMode === "peak_shaving"
          ? 0.65
          : 0.8
      : 1;

  const targetEnergyWh = input.systemType === "offgrid"
    ? loadResult.totalDailyEnergyWh + Math.max(batteryResult.requiredBatteryWh - loadResult.totalDailyEnergyWh, 0) * 0.15
    : loadResult.totalDailyEnergyWh * energyTargetFactor;

  const requiredPvEnergyWh = targetEnergyWh / Math.max(performanceRatio, 0.1);
  const requiredPvPowerW = requiredPvEnergyWh / Math.max(input.sunHours, 1);
  const designFactor = input.systemType === "gridtie" ? Math.max(1.05, input.designFactor * 0.95) : input.designFactor;
  const designPvPowerW = requiredPvPowerW * designFactor;
  const panelCount = Math.max(1, Math.ceil(designPvPowerW / input.panelWatt));

  const targetMpptVoltage = input.systemType === "gridtie"
    ? Math.min(Math.max(input.systemVoltage * 4, input.mpptMinVoltage), input.mpptMaxVoltage)
    : Math.min(Math.max(input.systemVoltage * 3, input.mpptMinVoltage), input.mpptMaxVoltage);
  const seriesCount = Math.max(1, Math.floor(targetMpptVoltage / Math.max(input.panelVmp, 1)));
  const parallelCount = Math.max(1, Math.ceil(panelCount / seriesCount));
  const adjustedPanelCount = seriesCount * parallelCount;
  const coldVocPerModule = input.panelVoc * (1 + input.panelTempCoeffVoc * Math.max(25 - input.minTemperature, 0));
  const stringVocCold = coldVocPerModule * seriesCount;
  const stringVmp = input.panelVmp * seriesCount;
  const installedPvPowerW = adjustedPanelCount * input.panelWatt;
  const estimatedDailyProductionWh = installedPvPowerW * input.sunHours * performanceRatio;

  return {
    performanceRatio: round(performanceRatio, 3),
    temperatureLossFactor: round(temperatureLossFactor, 3),
    altitudeFactor: round(altitudeFactor, 3),
    tiltFactor: round(tiltFactor, 3),
    energyTargetFactor: round(energyTargetFactor, 2),
    requiredPvEnergyWh: round(requiredPvEnergyWh),
    requiredPvPowerW: round(requiredPvPowerW),
    designPvPowerW: round(designPvPowerW),
    panelCount: adjustedPanelCount,
    panelSeriesCount: seriesCount,
    panelParallelCount: parallelCount,
    installedPvPowerW: round(installedPvPowerW),
    estimatedDailyProductionWh: round(estimatedDailyProductionWh),
    stringVmp: round(stringVmp),
    stringVocCold: round(stringVocCold),
  };
}
