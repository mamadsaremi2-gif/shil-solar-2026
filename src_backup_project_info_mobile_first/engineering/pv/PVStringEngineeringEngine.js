export function calculateStringWindow({ module, inverter, minTempC = 0, maxTempC = 45, maxSeries = 40 }) {
  const results = [];
  const vocCoeff = Math.abs(module.tempCoeffVocPercentPerC ?? -0.28) / 100;
  const vmpCoeff = Math.abs(module.tempCoeffVmpPercentPerC ?? -0.35) / 100;

  for (let series = 1; series <= maxSeries; series += 1) {
    const coldVoc = module.voc * series * (1 + vocCoeff * (25 - minTempC));
    const hotVmp = module.vmp * series * (1 - vmpCoeff * Math.max(maxTempC - 25, 0));
    const nominalVmp = module.vmp * series;

    const valid =
      coldVoc <= inverter.maxDcVoltage &&
      hotVmp >= inverter.mpptMinVoltage &&
      nominalVmp <= inverter.mpptMaxVoltage;

    results.push({
      series,
      coldVoc,
      hotVmp,
      nominalVmp,
      valid,
      issues: [
        coldVoc > inverter.maxDcVoltage ? "COLD_VOC_EXCEEDS_MAX_DC" : null,
        hotVmp < inverter.mpptMinVoltage ? "HOT_VMP_BELOW_MPPT_MIN" : null,
        nominalVmp > inverter.mpptMaxVoltage ? "NOMINAL_VMP_ABOVE_MPPT_MAX" : null
      ].filter(Boolean)
    });
  }

  const validSeries = results.filter((item) => item.valid).map((item) => item.series);
  return {
    minSeries: validSeries.length ? Math.min(...validSeries) : null,
    maxSeries: validSeries.length ? Math.max(...validSeries) : null,
    validSeries,
    results
  };
}
