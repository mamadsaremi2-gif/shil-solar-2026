import { createRange } from "../utils/engineeringMath.js";

function coldCorrectedVoc(panelVoc, series, tempCoeffPercentPerC, minTempC) {
  const delta = 25 - minTempC;
  const correction = 1 + Math.abs(tempCoeffPercentPerC) / 100 * delta;
  return panelVoc * series * correction;
}

export function sizePVStrings({
  panel,
  inverter,
  minTempC = 0,
  targetPowerW = 0,
  maxSeries = 30,
  maxParallel = 16
}) {
  const candidates = [];

  for (const series of createRange(1, maxSeries)) {
    const vmp = panel.vmp * series;
    const vocCold = coldCorrectedVoc(panel.voc, series, panel.tempCoeffVocPercentPerC, minTempC);

    if (vmp < inverter.mpptMinVoltage) continue;
    if (vmp > inverter.mpptMaxVoltage) continue;
    if (vocCold > inverter.maxDcVoltage) continue;

    for (const parallel of createRange(1, maxParallel)) {
      const powerW = panel.powerW * series * parallel;
      const deltaPowerW = Math.abs(powerW - targetPowerW);
      candidates.push({
        series,
        parallel,
        panelCount: series * parallel,
        powerW,
        vmp,
        vocCold,
        deltaPowerW
      });
    }
  }

  return candidates.sort((a, b) => a.deltaPowerW - b.deltaPowerW || a.panelCount - b.panelCount);
}
