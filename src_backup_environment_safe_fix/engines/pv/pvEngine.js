export function runPVEngine(form) {
  const { pv, environment } = form;
  const panelCount = pv.seriesCount * pv.parallelCount;
  const arrayPowerW = panelCount * pv.panelPowerW;
  const totalLossFactor = 1 - (
    environment.irradianceLossPercent +
    environment.soilingLossPercent +
    environment.shadingLossPercent
  ) / 100;

  const estimatedDailyEnergyWh = arrayPowerW * environment.peakSunHours * Math.max(totalLossFactor, 0);

  return {
    panelCount,
    arrayPowerW,
    stringVoltageVmp: pv.panelVmp * pv.seriesCount,
    stringVoltageVoc: pv.panelVoc * pv.seriesCount,
    arrayCurrentImp: pv.panelImp * pv.parallelCount,
    estimatedDailyEnergyWh
  };
}
