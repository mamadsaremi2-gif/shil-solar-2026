function round(value, digits = 2) {
  const f = 10 ** digits;
  return Math.round((Number(value) || 0) * f) / f;
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function calculateTemperatureVoltageCorrection(input, seriesModules = 1) {
  if (input.systemType === 'backup') {
    return {
      applicable: false,
      status: 'not_applicable',
      message: 'در برق اضطراری بدون پنل، اصلاح دما و ولتاژ PV وارد محاسبات نمی‌شود.',
    };
  }

  const minTempC = Number.isFinite(Number(input.realMinTemperature)) ? Number(input.realMinTemperature) : Number(input.minTemperature || 0);
  const maxTempC = Number.isFinite(Number(input.realMaxTemperature)) ? Number(input.realMaxTemperature) : Number(input.maxTemperature || 40);
  const avgTempC = Number.isFinite(Number(input.realAverageTemperature)) ? Number(input.realAverageTemperature) : Number(input.averageTemperature || 30);
  const panelVoc = Number(input.panelVoc || 53.1);
  const panelVmp = Number(input.panelVmp || 44.8);
  const panelWatt = Number(input.panelWatt || 585);
  const panelIsc = Number(input.panelIsc || input.panelShortCircuitCurrent || (panelWatt / Math.max(panelVmp, 1)) * 1.08);
  const imp = panelWatt / Math.max(panelVmp, 1);

  const vocCoeff = Number(input.panelTempCoeffVoc || input.vocTemperatureCoeff || 0.0024);
  const vmpCoeff = Number(input.panelTempCoeffVmp || input.vmpTemperatureCoeff || 0.0029);
  const iscCoeff = Number(input.panelTempCoeffIsc || input.iscTemperatureCoeff || 0.0005);
  const powerCoeffPercent = Number(input.panelTypeTemperatureFactor || input.powerTemperatureCoeff || 0.29);

  const coldDelta = Math.max(25 - minTempC, 0);
  const hotDelta = Math.max(maxTempC - 25, 0);
  const vocCorrected = panelVoc * (1 + vocCoeff * coldDelta);
  const vmpCorrected = panelVmp * clamp(1 - vmpCoeff * hotDelta, 0.7, 1.05);
  const iscCorrected = panelIsc * (1 + iscCoeff * Math.max(maxTempC - 25, 0));
  const avgDelta = Math.max(avgTempC - 25, 0);
  const powerTemperatureFactor = clamp(1 - (avgDelta * powerCoeffPercent) / 100, 0.72, 1.04);
  const stringVocCold = vocCorrected * Math.max(seriesModules, 1);
  const stringVmpHot = vmpCorrected * Math.max(seriesModules, 1);

  return {
    applicable: true,
    status: stringVocCold < Number(input.maxPvVocV || input.controllerMaxVoc || 500) ? 'pass' : 'error',
    minTempC: round(minTempC, 1),
    maxTempC: round(maxTempC, 1),
    avgTempC: round(avgTempC, 1),
    vocCoeff,
    vmpCoeff,
    iscCoeff,
    powerCoeffPercent,
    moduleVocColdV: round(vocCorrected, 2),
    moduleVmpHotV: round(vmpCorrected, 2),
    moduleIscHotA: round(iscCorrected, 2),
    moduleImpA: round(imp, 2),
    powerTemperatureFactor: round(powerTemperatureFactor, 3),
    seriesModules: Math.max(seriesModules, 1),
    stringVocColdV: round(stringVocCold, 1),
    stringVmpHotV: round(stringVmpHot, 1),
    maxPvVocV: Number(input.maxPvVocV || input.controllerMaxVoc || 500),
    message: stringVocCold < Number(input.maxPvVocV || input.controllerMaxVoc || 500)
      ? 'اصلاح دما/ولتاژ انجام شد و Voc زمستانی در محدوده مجاز است.'
      : 'Voc زمستانی از سقف ورودی PV عبور کرده است؛ تعداد پنل سری یا مدل اینورتر باید اصلاح شود.',
  };
}
