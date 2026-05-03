function roundUpToStep(value, step = 100) {
  return Math.ceil(value / step) * step;
}

export function calculateInverter(input, loadResult) {
  const designContinuousW = loadResult.demandPowerW * input.designFactor * 1.1;
  const continuousPowerW = roundUpToStep(Math.max(designContinuousW, loadResult.loadPowerW), 100);
  const designContinuousVA = (loadResult.demandApparentVA || loadResult.demandPowerW) * input.designFactor * 1.1;
  const continuousPowerVA = roundUpToStep(Math.max(designContinuousVA, continuousPowerW), 100);
  const requiredSurgePowerW = Math.max(loadResult.surgePowerW, continuousPowerW * 1.2);
  const requiredSurgeVA = Math.max(loadResult.surgeApparentVA || requiredSurgePowerW, continuousPowerVA * 1.2);
  const surgePowerW = roundUpToStep(requiredSurgePowerW, 100);
  const surgePowerVA = roundUpToStep(requiredSurgeVA, 100);
  const dcInputVoltage = input.systemVoltage;
  const utilizationRatio = loadResult.demandPowerW / Math.max(continuousPowerW, 1);
  const apparentUtilizationRatio = (loadResult.demandApparentVA || loadResult.demandPowerW) / Math.max(continuousPowerVA, 1);
  const estimatedDcCurrentA = surgePowerW / Math.max(dcInputVoltage * input.inverterEfficiency, 1);

  return {
    continuousPowerW,
    continuousPowerVA,
    surgePowerW,
    surgePowerVA,
    dcInputVoltage,
    utilizationRatio,
    apparentUtilizationRatio,
    estimatedDcCurrentA,
  };
}
