function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateController(input, pvResult) {
  if (!pvResult || input.systemType === 'backup' || input.systemType === 'gridtie') return null;

  const safetyFactor = 1.25;
  const requiredCurrentA = (pvResult.installedPvPowerW / Math.max(input.systemVoltage, 1)) * safetyFactor;
  const selectedCurrentA = Math.ceil(requiredCurrentA / 10) * 10;
  const controllerType = input.controllerType || 'MPPT';
  const stringVmp = pvResult.stringVmp;
  const stringVocCold = pvResult.stringVocCold;
  const mpptWindowOk = stringVmp >= input.mpptMinVoltage && stringVmp <= input.mpptMaxVoltage;
  const vocOk = stringVocCold < input.controllerMaxVoc;

  return {
    controllerType,
    safetyFactor,
    requiredCurrentA: round(requiredCurrentA),
    selectedCurrentA,
    maxInputVoltageV: input.controllerMaxVoc,
    mpptMinVoltage: input.mpptMinVoltage,
    mpptMaxVoltage: input.mpptMaxVoltage,
    stringVmp: round(stringVmp),
    stringVocCold: round(stringVocCold),
    mpptWindowOk,
    vocOk,
  };
}
