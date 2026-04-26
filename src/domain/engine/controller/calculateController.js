function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function chooseControllerBank(requiredCurrentA) {
  const standardRatings = [40, 60, 80, 100, 120, 150, 200];
  const maxSingleCurrent = 200;
  if (requiredCurrentA <= maxSingleCurrent) {
    const perControllerA = standardRatings.find((rating) => rating >= requiredCurrentA) ?? 200;
    return { controllerCount: 1, perControllerA, selectedCurrentA: perControllerA };
  }

  let best = null;
  for (const perControllerA of standardRatings.filter((rating) => rating >= 80)) {
    const controllerCount = Math.ceil(requiredCurrentA / perControllerA);
    const selectedCurrentA = controllerCount * perControllerA;
    const oversizeRatio = selectedCurrentA / Math.max(requiredCurrentA, 1);
    const candidate = { controllerCount, perControllerA, selectedCurrentA, oversizeRatio };
    if (!best || candidate.controllerCount < best.controllerCount ||
      (candidate.controllerCount === best.controllerCount && candidate.oversizeRatio < best.oversizeRatio)) {
      best = candidate;
    }
  }
  return best;
}

export function calculateController(input, pvResult) {
  if (!pvResult || input.systemType === 'backup' || input.systemType === 'gridtie') return null;

  const safetyFactor = 1.25;
  const requiredCurrentA = (pvResult.installedPvPowerW / Math.max(input.systemVoltage, 1)) * safetyFactor;
  const bank = chooseControllerBank(requiredCurrentA);
  const controllerType = input.controllerType || 'MPPT';
  const stringVmp = pvResult.stringVmp;
  const stringVocCold = pvResult.stringVocCold;
  const mpptWindowOk = stringVmp >= input.mpptMinVoltage && stringVmp <= input.mpptMaxVoltage;
  const vocOk = stringVocCold < input.controllerMaxVoc;

  return {
    controllerType,
    safetyFactor,
    requiredCurrentA: round(requiredCurrentA),
    selectedCurrentA: bank.selectedCurrentA,
    controllerCount: bank.controllerCount,
    perControllerA: bank.perControllerA,
    maxInputVoltageV: input.controllerMaxVoc,
    mpptMinVoltage: input.mpptMinVoltage,
    mpptMaxVoltage: input.mpptMaxVoltage,
    stringVmp: round(stringVmp),
    stringVocCold: round(stringVocCold),
    mpptWindowOk,
    vocOk,
  };
}
