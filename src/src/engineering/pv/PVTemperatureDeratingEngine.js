export function estimateCellTemperature({ ambientTempC, irradianceWm2 = 1000, noctC = 45 }) {
  return ambientTempC + ((noctC - 20) / 800) * irradianceWm2;
}

export function calculateTemperatureDerating({ cellTempC, powerTempCoeffPercentPerC = -0.35 }) {
  const delta = cellTempC - 25;
  return 1 + (powerTempCoeffPercentPerC / 100) * delta;
}

export function calculatePVModuleOutput({
  stcPowerW,
  ambientTempC,
  irradianceWm2 = 1000,
  noctC = 45,
  powerTempCoeffPercentPerC = -0.35
}) {
  const cellTempC = estimateCellTemperature({ ambientTempC, irradianceWm2, noctC });
  const tempFactor = calculateTemperatureDerating({ cellTempC, powerTempCoeffPercentPerC });
  const irradianceFactor = irradianceWm2 / 1000;
  const outputW = stcPowerW * irradianceFactor * Math.max(tempFactor, 0);

  return {
    cellTempC,
    tempFactor,
    irradianceFactor,
    outputW
  };
}

export function calculateArrayMonthlyOutput({ form, monthlyClimate, noctC = 45, powerTempCoeffPercentPerC = -0.35 }) {
  const arrayStcW = form.pv.panelPowerW * form.pv.seriesCount * form.pv.parallelCount;
  const systemLossFactor = 1 - (
    form.environment.irradianceLossPercent +
    form.environment.soilingLossPercent +
    form.environment.shadingLossPercent
  ) / 100;

  return monthlyClimate.monthlyPeakSunHours.map((psh, index) => {
    const ambientTempC = monthlyClimate.monthlyAvgTempC[index];
    const module = calculatePVModuleOutput({
      stcPowerW: arrayStcW,
      ambientTempC,
      irradianceWm2: 1000,
      noctC,
      powerTempCoeffPercentPerC
    });

    return {
      month: index + 1,
      peakSunHours: psh,
      ambientTempC,
      cellTempC: module.cellTempC,
      tempFactor: module.tempFactor,
      estimatedEnergyWh: module.outputW * psh * 30 * Math.max(systemLossFactor, 0)
    };
  });
}
