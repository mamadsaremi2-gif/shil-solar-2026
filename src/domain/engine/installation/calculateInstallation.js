function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function lossFactor(percent) {
  return clamp(1 - (Number(percent) || 0) / 100, 0.01, 1);
}

function normalizeAzimuth(azimuthDeg) {
  let a = Number(azimuthDeg) || 0;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

function azimuthLabel(azimuthDeg) {
  const a = normalizeAzimuth(azimuthDeg);
  if (Math.abs(a) <= 15) return 'جنوب';
  if (a > 15 && a <= 60) return 'جنوب غربی';
  if (a < -15 && a >= -60) return 'جنوب شرقی';
  if (a > 60 && a <= 120) return 'غربی';
  if (a < -60 && a >= -120) return 'شرقی';
  return 'شمالی/نامناسب';
}

function calculateOrientationLossPercent(azimuthDeg) {
  const deviation = Math.abs(normalizeAzimuth(azimuthDeg));
  if (deviation <= 15) return 0;
  if (deviation <= 45) return 3 + ((deviation - 15) / 30) * 5;
  if (deviation <= 90) return 8 + ((deviation - 45) / 45) * 12;
  if (deviation <= 135) return 20 + ((deviation - 90) / 45) * 18;
  return 45;
}

function recommendedTilt(latitude, seasonalGoal) {
  const lat = Math.abs(Number(latitude) || 32);
  if (seasonalGoal === 'winter') return clamp(lat + 12, 10, 60);
  if (seasonalGoal === 'summer') return clamp(lat - 10, 5, 45);
  return clamp(lat, 10, 45);
}

function calculateTiltLossPercent(selectedTilt, recommended) {
  const diff = Math.abs((Number(selectedTilt) || recommended) - recommended);
  if (diff <= 5) return 0;
  if (diff <= 15) return 2 + ((diff - 5) / 10) * 4;
  if (diff <= 30) return 6 + ((diff - 15) / 15) * 8;
  return 18;
}

function spacingMultiplier(siteType, tiltDeg, walkwayM) {
  const tilt = Number(tiltDeg) || 30;
  const walkway = Number(walkwayM) || 0.6;
  if (siteType === 'sloped_roof') return 1.18 + walkway * 0.12;
  if (siteType === 'ground') return 1.55 + Math.max(tilt - 20, 0) * 0.018 + walkway * 0.25;
  return 1.35 + Math.max(tilt - 15, 0) * 0.015 + walkway * 0.22;
}

function deriveIpRating(location, siteType) {
  if (location === 'indoor') return { enclosure: 'IP20/IP40', outdoorDcBox: siteType === 'indoor' ? 'IP40' : 'IP65' };
  if (location === 'semi_outdoor' || location === 'shaded_outdoor') return { enclosure: 'IP54/IP65', outdoorDcBox: 'IP65' };
  return { enclosure: 'IP65/IP66', outdoorDcBox: 'IP65/IP66' };
}

function dustLossPercent(level) {
  if (level === 'high') return 7;
  if (level === 'medium') return 4;
  if (level === 'low') return 2;
  return 3;
}

function shadingLossPercent(level) {
  if (level === 'high') return 18;
  if (level === 'medium') return 9;
  if (level === 'low') return 3;
  return 0;
}

function availabilityLossPercent(level) {
  if (level === 'high') return 3;
  if (level === 'medium') return 1.5;
  return 1;
}

export function calculateInstallation(input, pv, inverter, cabling) {
  if (!pv || input.systemType === 'backup') return null;

  const siteType = input.installationSiteType || 'flat_roof';
  const panelLengthM = input.panelLengthM || 2.28;
  const panelWidthM = input.panelWidthM || 1.13;
  const walkwayM = input.maintenanceWalkwayM || 0.6;
  const edgeSetbackM = input.edgeSetbackM || 0.5;
  const panelAreaM2 = pv.panelCount * panelLengthM * panelWidthM;
  const areaMultiplier = spacingMultiplier(siteType, input.tiltAngle, walkwayM);
  const requiredAreaM2 = panelAreaM2 * areaMultiplier + Math.max(edgeSetbackM, 0) * 4;
  const usableAreaM2 = (input.roofAreaM2 || input.availableAreaM2 || 0) * (input.roofUsablePercent || 0.75);
  const areaStatus = usableAreaM2 <= 0 ? 'unknown' : usableAreaM2 >= requiredAreaM2 ? 'pass' : usableAreaM2 >= requiredAreaM2 * 0.85 ? 'warning' : 'error';

  const seasonalGoal = input.tiltDesignGoal || (input.systemType === 'offgrid' ? 'winter' : 'annual');
  const recommendedTiltDeg = recommendedTilt(input.latitude, seasonalGoal);
  const selectedTiltDeg = input.tiltAngle;
  const tiltLossPercent = calculateTiltLossPercent(selectedTiltDeg, recommendedTiltDeg);
  const azimuthDeg = normalizeAzimuth(input.azimuthDeg);
  const orientationLossPercent = calculateOrientationLossPercent(azimuthDeg);

  const cableLossPercent = cabling?.dcVoltageDropPercent || Math.max(0, (1 - (input.cableLossFactor || 0.97)) * 100);
  const tempLossPercent = Math.max(0, (1 - (pv.temperatureLossFactor || 1)) * 100);
  const dustPct = dustLossPercent(input.dustLevel);
  const shadingPct = Math.max(shadingLossPercent(input.shadingLevel), Math.max(0, (1 - (input.shadingFactor || 1)) * 100));
  const mismatchLossPercent = input.mismatchLossPercent || 2;
  const degradationLossPercent = input.degradationLossPercent || 0.7;
  const availabilityPct = availabilityLossPercent(input.maintenanceRiskLevel);
  const inverterLossPercent = Math.max(0, (1 - (input.inverterEfficiency || inverter?.efficiency || 0.96)) * 100);

  const installationLossFactor = lossFactor(orientationLossPercent) * lossFactor(tiltLossPercent) * lossFactor(cableLossPercent) * lossFactor(dustPct) * lossFactor(shadingPct) * lossFactor(mismatchLossPercent) * lossFactor(degradationLossPercent) * lossFactor(availabilityPct);
  const netDailyProductionWh = pv.installedPvPowerW * input.sunHours * (input.controllerEfficiency || 0.95) * (pv.temperatureLossFactor || 1) * installationLossFactor;
  const coverageRatio = input.totalDailyEnergyWh > 0 ? netDailyProductionWh / input.totalDailyEnergyWh : null;

  const dcAcRatio = inverter?.continuousPowerW ? pv.installedPvPowerW / inverter.continuousPowerW : 0;
  const voltagePreferred = input.dcCableLength > 25 || pv.installedPvPowerW > 5000 || cabling?.dcVoltageDropPercent > input.dcVoltageDropLimit * 0.75;
  const currentPreferred = pv.stringVocCold > input.controllerMaxVoc * 0.85 || pv.panelSeriesCount >= Math.floor(input.mpptMaxVoltage / Math.max(input.panelVmp, 1));

  const parallelStrings = pv.panelParallelCount || 1;
  const stringFuseRequired = parallelStrings > 1;
  const designIscA = pv.stringCurrentA * 1.25;
  const dcVoltageClassV = input.controllerMaxVoc <= 600 ? 600 : input.controllerMaxVoc <= 1000 ? 1000 : 1500;
  const ip = deriveIpRating(input.inverterLocation, siteType);

  const serviceabilityScore = Math.max(0, Math.min(100,
    100
    - (areaStatus === 'error' ? 35 : areaStatus === 'warning' ? 15 : 0)
    - (walkwayM < 0.5 ? 12 : 0)
    - (orientationLossPercent > 12 ? 10 : 0)
    - (tiltLossPercent > 8 ? 8 : 0)
    - (input.dcCableLength > 40 ? 8 : input.dcCableLength > 25 ? 4 : 0)
    - (shadingPct > 8 ? 15 : shadingPct > 3 ? 6 : 0)
  ));

  const daytimeEquivalent = {
    sunHours: input.sunHours,
    grossWhAtPsh: round(pv.installedPvPowerW * input.sunHours),
    netWhAtPsh: round(netDailyProductionWh),
    nonPshBehavior: 'تولید 5 ساعت تابش مفید معادل انرژی روزانه است؛ پنل در صبح/عصر کم‌تولید و در شب صفر است.',
  };

  return {
    area: {
      siteType,
      panelLengthM,
      panelWidthM,
      panelAreaM2: round(panelAreaM2, 1),
      requiredAreaM2: round(requiredAreaM2, 1),
      usableAreaM2: round(usableAreaM2, 1),
      maintenanceWalkwayM: walkwayM,
      edgeSetbackM,
      status: areaStatus,
    },
    orientation: {
      selectedAzimuthDeg: azimuthDeg,
      recommendedAzimuthDeg: 0,
      label: azimuthLabel(azimuthDeg),
      orientationLossPercent: round(orientationLossPercent, 1),
      status: orientationLossPercent <= 8 ? 'pass' : orientationLossPercent <= 20 ? 'warning' : 'error',
    },
    tilt: {
      selectedTiltDeg,
      recommendedTiltDeg: round(recommendedTiltDeg, 0),
      designGoal: seasonalGoal,
      tiltLossPercent: round(tiltLossPercent, 1),
      status: tiltLossPercent <= 6 ? 'pass' : tiltLossPercent <= 14 ? 'warning' : 'error',
    },
    cableRoute: {
      dcCableOneWayLengthM: input.dcCableLength,
      effectiveLoopLengthM: round(input.dcCableLength * 2, 1),
      voltageDropPercent: cabling?.dcVoltageDropPercent || 0,
      recommendedCableMm2: cabling?.dcCableSizeMm2 || 0,
      routeStatus: input.dcCableLength <= 25 ? 'pass' : input.dcCableLength <= 40 ? 'warning' : 'error',
    },
    protection: {
      dcIsolator: `${Math.ceil(designIscA)}A / ${dcVoltageClassV}VDC`,
      dcSpd: `Type II DC ${dcVoltageClassV}V`,
      stringFuseRequired,
      stringFuse: stringFuseRequired ? `${Math.ceil(designIscA)}A gPV / ${dcVoltageClassV}VDC` : 'برای یک رشته در هر MPPT معمولاً لازم نیست؛ دیتاشیت پنل کنترل شود',
      combinerBox: parallelStrings > 1 ? `Combiner DC با حداقل ${parallelStrings} ورودی، SPD و ایزولاتور` : 'تابلو DC ساده با SPD و ایزولاتور',
      ipRating: ip.outdoorDcBox,
      earthing: 'هم‌بندی فریم پنل، سازه و تابلو DC به ارت حفاظتی',
    },
    losses: {
      temperatureLossPercent: round(tempLossPercent, 1),
      orientationLossPercent: round(orientationLossPercent, 1),
      tiltLossPercent: round(tiltLossPercent, 1),
      dustLossPercent: round(dustPct, 1),
      shadingLossPercent: round(shadingPct, 1),
      dcCableLossPercent: round(cableLossPercent, 2),
      mismatchLossPercent: round(mismatchLossPercent, 1),
      degradationLossPercent: round(degradationLossPercent, 1),
      availabilityLossPercent: round(availabilityPct, 1),
      inverterLossPercent: round(inverterLossPercent, 1),
      totalInstallationLossPercent: round((1 - installationLossFactor) * 100, 1),
      netDailyProductionWh: round(netDailyProductionWh),
    },
    stringingStrategy: {
      dcAcRatio: round(dcAcRatio, 2),
      preferredGrowth: voltagePreferred && !currentPreferred ? 'series_voltage' : currentPreferred ? 'parallel_current_or_more_mppt' : 'balanced',
      reason: voltagePreferred && !currentPreferred
        ? 'طول مسیر/توان بالا است؛ افزایش ولتاژ رشته باعث کاهش جریان، افت ولتاژ و سطح مقطع کابل می‌شود.'
        : currentPreferred
          ? 'ولتاژ رشته به سقف MPPT/Voc نزدیک است؛ افزایش توان باید با رشته موازی یا MPPT جدا انجام شود.'
          : 'آرایش فعلی از نظر ولتاژ و جریان متعادل است.',
    },
    daytimeEquivalent,
    serviceability: {
      score: round(serviceabilityScore, 0),
      walkwayOk: walkwayM >= 0.5,
      accessOk: areaStatus !== 'error',
      cleaningAccessOk: walkwayM >= 0.6,
      maintenanceRisk: serviceabilityScore >= 80 ? 'low' : serviceabilityScore >= 60 ? 'medium' : 'high',
    },
  };
}
