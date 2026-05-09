export const NOMINAL_VOLTAGE_WINDOWS = [
  { nominal: 12, min: 10.5, max: 15.0 },
  { nominal: 24, min: 21.0, max: 30.0 },
  { nominal: 48, min: 42.0, max: 60.0 },
  { nominal: 96, min: 84.0, max: 120.0 },
  { nominal: 192, min: 168.0, max: 240.0 },
];

export const SEASON_USAGE_FACTORS = {
  annual: 1,
  summer: 0.95,
  winter: 0.9,
  spring_autumn: 0.85,
  occasional: 0.55,
};

export function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getVoltageWindow(systemVoltage) {
  const nominal = numberOr(systemVoltage, 48);
  return NOMINAL_VOLTAGE_WINDOWS.find((item) => Math.abs(item.nominal - nominal) < 0.01) || {
    nominal,
    min: nominal * 0.875,
    max: nominal * 1.25,
  };
}

export function deriveBatterySeriesCount(systemVoltage, unitVoltage) {
  const voltage = numberOr(unitVoltage, 0);
  if (voltage <= 0) return { ok: false, seriesCount: 0, bankVoltage: 0, window: getVoltageWindow(systemVoltage) };
  const window = getVoltageWindow(systemVoltage);
  let best = null;
  for (let seriesCount = 1; seriesCount <= 16; seriesCount += 1) {
    const bankVoltage = voltage * seriesCount;
    const inside = bankVoltage >= window.min && bankVoltage <= window.max;
    const distance = Math.abs(bankVoltage - window.nominal);
    const candidate = { ok: inside, seriesCount, bankVoltage, window, distance };
    if (inside && (!best || candidate.distance < best.distance || (candidate.distance === best.distance && candidate.seriesCount < best.seriesCount))) {
      best = candidate;
    }
  }
  if (best) return best;
  const seriesCount = Math.max(1, Math.round(window.nominal / voltage));
  const bankVoltage = voltage * seriesCount;
  return { ok: bankVoltage >= window.min && bankVoltage <= window.max, seriesCount, bankVoltage, window, distance: Math.abs(bankVoltage - window.nominal) };
}

export function isBatteryVoltageCompatible(systemVoltage, unitVoltage) {
  return deriveBatterySeriesCount(systemVoltage, unitVoltage).ok;
}

export function voltageCompatibilityMessage(systemVoltage, unitVoltage) {
  const result = deriveBatterySeriesCount(systemVoltage, unitVoltage);
  const { window } = result;
  if (result.ok) {
    return `ولتاژ بانک باتری ${result.bankVoltage.toFixed(1)}V با اینورتر ${window.nominal}V در بازه مجاز ${window.min}-${window.max}V است.`;
  }
  return `ولتاژ بانک باتری ${result.bankVoltage.toFixed(1)}V با اینورتر ${window.nominal}V همخوان نیست. بازه مجاز این کلاس ${window.min}-${window.max}V است.`;
}

export function seasonFactor(profile) {
  return SEASON_USAGE_FACTORS[profile] ?? 1;
}


export const OFFGRID_INVERTER_MPPT_PROFILES = [
  {
    id: 'offgrid-1_6-to-3_2kw',
    title: 'آفگرید 1.6 تا 3.2 کیلووات',
    minRatedPowerW: 0,
    maxRatedPowerW: 3200,
    maxPvVocV: 500,
    mpptMinVoltageV: 30,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 30,
    mpptCount: 1,
    maxPvPowerPerMpptW: null,
  },
  {
    id: 'offgrid-4-to-6kw',
    title: 'آفگرید 4 تا 6 کیلووات',
    minRatedPowerW: 3200.01,
    maxRatedPowerW: 6000,
    maxPvVocV: 500,
    mpptMinVoltageV: 60,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 60,
    mpptCount: 1,
    maxPvPowerPerMpptW: null,
  },
  {
    id: 'offgrid-8kw-2mppt',
    title: 'آفگرید 8 کیلووات دو MPPT',
    minRatedPowerW: 6000.01,
    maxRatedPowerW: 8000,
    maxPvVocV: 500,
    mpptMinVoltageV: 60,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 60,
    mpptCount: 2,
    maxPvPowerPerMpptW: 4000,
    maxPvPowerW: 8000,
  },
  {
    id: 'offgrid-10kw-2mppt',
    title: 'آفگرید 10 کیلووات دو MPPT',
    minRatedPowerW: 8000.01,
    maxRatedPowerW: 10000,
    maxPvVocV: 500,
    mpptMinVoltageV: 60,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 60,
    mpptCount: 2,
    maxPvPowerPerMpptW: 5000,
    maxPvPowerW: 10000,
  },
];

export const HYBRID_INVERTER_MPPT_PROFILES = [
  {
    id: 'hybrid-4-to-6kw-27a',
    title: 'هیبرید 4 تا 6 کیلووات - ورودی PV 27A',
    minRatedPowerW: 3200.01,
    maxRatedPowerW: 6000,
    maxPvVocV: 500,
    mpptMinVoltageV: 60,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 70,
    mpptStartupToleranceV: 10,
    mpptCount: 1,
    maxInputCurrentPerMpptA: 27,
    maxShortCircuitCurrentPerMpptA: 27,
    maxPvPowerPerMpptW: null,
  },
  {
    id: 'hybrid-8-to-11kw',
    title: 'هیبرید 8 تا 11 کیلووات',
    minRatedPowerW: 6000.01,
    maxRatedPowerW: 11000,
    maxPvVocV: 500,
    mpptMinVoltageV: 60,
    mpptMaxVoltageV: 450,
    mpptStartupVoltageV: 60,
    mpptCount: 2,
    maxPvPowerPerMpptW: null,
  },
];

export function getOffgridInverterMpptProfile(ratedPowerW) {
  const rated = numberOr(ratedPowerW, 0);
  if (rated <= 0) return null;
  return OFFGRID_INVERTER_MPPT_PROFILES.find((profile) => rated >= profile.minRatedPowerW && rated <= profile.maxRatedPowerW) || null;
}

export function getHybridInverterMpptProfile(ratedPowerW) {
  const rated = numberOr(ratedPowerW, 0);
  if (rated <= 0) return null;
  return HYBRID_INVERTER_MPPT_PROFILES.find((profile) => rated >= profile.minRatedPowerW && rated <= profile.maxRatedPowerW) || null;
}

export function getInverterMpptProfile(systemType, ratedPowerW) {
  if (systemType === 'offgrid') return getOffgridInverterMpptProfile(ratedPowerW);
  if (systemType === 'hybrid') return getHybridInverterMpptProfile(ratedPowerW);
  return null;
}

export function buildMpptDefaultsFromRatedPower(ratedPowerW, systemType = 'offgrid') {
  const profile = getInverterMpptProfile(systemType, ratedPowerW);
  if (!profile) return {};
  return {
    inverterRatedPowerW: ratedPowerW,
    inverterAcPowerW: ratedPowerW,
    inverterMpptProfileId: profile.id,
    inverterMpptProfileTitle: profile.title,
    offgridMpptProfileId: systemType === 'offgrid' ? profile.id : '',
    offgridMpptProfileTitle: systemType === 'offgrid' ? profile.title : '',
    hybridMpptProfileId: systemType === 'hybrid' ? profile.id : '',
    hybridMpptProfileTitle: systemType === 'hybrid' ? profile.title : '',
    maxPvVocV: profile.maxPvVocV,
    controllerMaxVoc: profile.maxPvVocV,
    mpptMinVoltage: profile.mpptMinVoltageV,
    mpptMaxVoltage: profile.mpptMaxVoltageV,
    mpptStartupVoltage: profile.mpptStartupVoltageV,
    mpptStartupToleranceV: profile.mpptStartupToleranceV || undefined,
    mpptCount: profile.mpptCount,
    maxInputCurrentPerMpptA: profile.maxInputCurrentPerMpptA || undefined,
    mpptMaxInputCurrent: profile.maxInputCurrentPerMpptA || undefined,
    maxShortCircuitCurrentPerMpptA: profile.maxShortCircuitCurrentPerMpptA || undefined,
    maxPvPowerPerMpptW: profile.maxPvPowerPerMpptW || undefined,
    maxPvPowerW: profile.maxPvPowerW || undefined,
  };
}
