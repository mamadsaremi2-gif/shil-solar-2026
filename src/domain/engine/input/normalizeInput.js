import { parseFaNumber } from "../../../shared/utils/faNumbers.js";
import { buildMpptDefaultsFromRatedPower, seasonFactor } from "../rules/engineeringRules.js";

function positive(value, fallback = 0) {
  const n = parseFaNumber(value, fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function nonNegative(value, fallback = 0) {
  const n = parseFaNumber(value, fallback);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function bounded(value, fallback, min, max) {
  const n = parseFaNumber(value, fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

const BACKUP_SYSTEM_VOLTAGES = [12, 24, 48];
const BATTERY_UNIT_VOLTAGES = [12, 12.6, 12.8, 24, 25, 25.6, 26, 48, 51, 51.2, 52];

function nearestAllowed(value, allowed, fallback) {
  const n = parseFaNumber(value, fallback);
  if (!Number.isFinite(n)) return fallback;
  return allowed.includes(n) ? n : fallback;
}

export function normalizeInput(form) {
  const loadItems = (form.loadItems || []).map((item, index) => ({
    id: item.id ?? `${index + 1}`,
    name: item.name || `بار ${index + 1}`,
    qty: positive(item.qty, 1),
    power: positive(item.power),
    hours: positive(item.hours, 1),
    powerFactor: bounded(item.powerFactor, 0.95, 0.5, 1),
    coincidenceFactor: bounded(item.coincidenceFactor, 1, 0.1, 1),
    seasonalUseFactor: bounded(item.seasonalUseFactor, 1, 0, 1),
    seasons: Array.isArray(item.seasons) ? item.seasons : (item.seasons ? String(item.seasons).split(",") : ["annual"]),
    surgeFactor: positive(item.surgeFactor, 1),
    loadType: item.loadType || "mixed",
    inverterSupply: item.inverterSupply || "with_inverter",
    backupPriority: item.backupPriority || item.priority || "critical",
  }));

  const loadProfile = (form.loadProfile || []).map((slot, index) => ({
    id: slot.id ?? `hour-${index}`,
    hour: Number.isInteger(slot.hour) ? slot.hour : index,
    label: slot.label || `${String(index).padStart(2, "0")}:00`,
    factor: bounded(slot.factor, 0.5, 0, 3),
  }));

  const systemType = form.systemType || "offgrid";
  const backupWithSolar = Boolean(form.backupWithSolar || form.backupSolarMode === "with_solar" || form.systemSubtype === "backup_with_solar");
  const safeBackupHours = nonNegative(form.backupHours, 0);
  const normalizedSystemVoltage = systemType === "backup"
    ? nearestAllowed(form.systemVoltage, BACKUP_SYSTEM_VOLTAGES, 24)
    : positive(form.systemVoltage, 48);
  const normalizedBatteryUnitVoltage = systemType === "backup"
    ? nearestAllowed(form.batteryUnitVoltage, BATTERY_UNIT_VOLTAGES, 12)
    : positive(form.batteryUnitVoltage, 12);
  const seasonProfile = form.seasonProfile || "annual";
  const inverterRatedPowerW = positive(form.inverterRatedPowerW, positive(form.inverterAcPowerW, positive(form.ratedPowerW, 0)));
  const inverterMpptDefaults = ["offgrid", "hybrid"].includes(systemType) ? buildMpptDefaultsFromRatedPower(inverterRatedPowerW, systemType) : {};

  return {
    ...form,
    systemType,
    backupWithSolar,
    backupSolarMode: backupWithSolar ? "with_solar" : "battery_only",
    systemSubtype: backupWithSolar ? "backup_with_solar" : form.systemSubtype || "",
    batteryRechargeDays: positive(form.batteryRechargeDays, systemType === "offgrid" ? 2 : 1),
    backupSolarDailySupportFactor: bounded(form.backupSolarDailySupportFactor, 0, 0, 1),
    hybridMode: form.hybridMode || "self_consumption",
    targetOffsetPercent: bounded(form.targetOffsetPercent, 85, 10, 150),
    gridAvailableHours: bounded(form.gridAvailableHours, 24, 1, 24),
    loadVoltage: positive(form.loadVoltage, 220),
    current: positive(form.current),
    loadPower: positive(form.loadPower),
    powerFactor: bounded(form.powerFactor, 0.95, 0.5, 1),
    coincidenceFactor: bounded(form.coincidenceFactor, 1, 0.1, 1),
    seasonProfile,
    seasonUsageFactor: bounded(form.seasonUsageFactor, seasonFactor(seasonProfile), 0, 1),
    backupHours: safeBackupHours,
    dailyUsageHours: positive(form.dailyUsageHours, 3),
    dailyEnergyKwh: positive(form.dailyEnergyKwh),
    peakFactor: positive(form.peakFactor, 2),
    loadProfileSource: form.loadProfileSource || "template",
    loadProfile,
    sunHours: positive(form.sunHours, 5),
    systemVoltage: normalizedSystemVoltage,
    batteryUnitVoltage: normalizedBatteryUnitVoltage,
    batteryUnitAh: positive(form.batteryUnitAh, 100),
    batteryFactor: positive(form.batteryFactor, 1),
    backupParallelCount: systemType === "backup" ? nonNegative(form.backupParallelCount, 0) : 0,
    batteryRoundTripEfficiency: bounded(form.batteryRoundTripEfficiency, 0.95, 0.5, 1),
    daysAutonomy: systemType === "backup" ? 0 : nonNegative(form.daysAutonomy, 0),
    dod: bounded(form.dod, 0.8, 0.1, 0.95),
    inverterEfficiency: bounded(form.inverterEfficiency, 0.93, 0.5, 1),
    controllerEfficiency: bounded(form.controllerEfficiency, 0.95, 0.5, 1),
    cableLossFactor: bounded(form.cableLossFactor, 0.97, 0.5, 1),
    panelLossFactor: bounded(form.panelLossFactor, 0.9, 0.5, 1),
    panelFactor: positive(form.panelFactor, 1),
    pvDesignReserveFactor: positive(form.panelFactor, positive(form.pvDesignReserveFactor, 1)),
    designFactor: positive(form.designFactor, 1.2),
    surgeFactor: positive(form.surgeFactor, 1.5),
    panelWatt: positive(form.panelWatt, 585),
    panelVoc: positive(form.panelVoc, 53.1),
    panelVmp: positive(form.panelVmp, 44.8),
    panelTempCoeffVoc: positive(form.panelTempCoeffVoc, 0.0024),
    panelPowerTempCoeffPercentPerC: positive(form.panelPowerTempCoeffPercentPerC, positive(form.panelTypeTemperatureFactor, 0.29)),
    panelVmpTempCoeffPercentPerC: positive(form.panelVmpTempCoeffPercentPerC, positive(form.panelPowerTempCoeffPercentPerC, positive(form.panelTypeTemperatureFactor, 0.29))),
    panelTypeTemperatureFactor: positive(form.panelTypeTemperatureFactor, 0.29),
    averageTemperature: parseFaNumber(form.averageTemperature, 30),
    minTemperature: parseFaNumber(form.minTemperature, 0),
    maxTemperature: parseFaNumber(form.maxTemperature, 40),
    altitude: positive(form.altitude, 0),
    shadingFactor: bounded(form.shadingFactor, 0.95, 0.5, 1),
    dustFactor: bounded(form.dustFactor, 0.96, 0.5, 1),
    tiltAngle: positive(form.tiltAngle, 30),
    latitude: parseFaNumber(form.latitude, 32),
    longitude: parseFaNumber(form.longitude, 53),
    azimuthDeg: parseFaNumber(form.azimuthDeg, 0),
    panelLengthM: positive(form.panelLengthM, 2.28),
    panelWidthM: positive(form.panelWidthM, 1.13),
    installationSiteType: form.installationSiteType || 'flat_roof',
    roofAreaM2: nonNegative(form.roofAreaM2, nonNegative(form.availableAreaM2, 0)),
    availableAreaM2: nonNegative(form.availableAreaM2, nonNegative(form.roofAreaM2, 0)),
    roofUsablePercent: bounded(form.roofUsablePercent, 0.75, 0.2, 1),
    maintenanceWalkwayM: bounded(form.maintenanceWalkwayM, 0.6, 0.2, 1.5),
    edgeSetbackM: bounded(form.edgeSetbackM, 0.5, 0, 2),
    tiltDesignGoal: form.tiltDesignGoal || (systemType === 'offgrid' ? 'winter' : 'annual'),
    shadingLevel: form.shadingLevel || 'none',
    dustLevel: form.dustLevel || 'medium',
    maintenanceRiskLevel: form.maintenanceRiskLevel || 'low',
    inverterLocation: form.inverterLocation || 'indoor',
    mismatchLossPercent: bounded(form.mismatchLossPercent, 2, 0, 10),
    degradationLossPercent: bounded(form.degradationLossPercent, 0.7, 0, 3),
    mpptArchitecture: form.mpptArchitecture || 'inverter_internal',
    inverterModel: form.inverterModel || form.selectedInverterName || '',
    inverterRatedPowerW,
    inverterAcPowerW: positive(form.inverterAcPowerW, inverterRatedPowerW),
    offgridMpptProfileId: form.offgridMpptProfileId || inverterMpptDefaults.offgridMpptProfileId || "",
    offgridMpptProfileTitle: form.offgridMpptProfileTitle || inverterMpptDefaults.offgridMpptProfileTitle || "",
    hybridMpptProfileId: form.hybridMpptProfileId || inverterMpptDefaults.hybridMpptProfileId || "",
    hybridMpptProfileTitle: form.hybridMpptProfileTitle || inverterMpptDefaults.hybridMpptProfileTitle || "",
    inverterMpptProfileId: form.inverterMpptProfileId || inverterMpptDefaults.inverterMpptProfileId || "",
    inverterMpptProfileTitle: form.inverterMpptProfileTitle || inverterMpptDefaults.inverterMpptProfileTitle || "",
    mpptCount: positive(form.mpptCount, positive(inverterMpptDefaults.mpptCount, 1)),
    maxStringsPerMppt: positive(form.maxStringsPerMppt, 2),
    controllerMaxVoc: positive(form.controllerMaxVoc, positive(form.maxPvVocV, positive(inverterMpptDefaults.controllerMaxVoc, 500))),
    maxPvVocV: positive(form.maxPvVocV, positive(form.controllerMaxVoc, positive(inverterMpptDefaults.maxPvVocV, 500))),
    mpptMinVoltage: positive(form.mpptMinVoltage, positive(inverterMpptDefaults.mpptMinVoltage, 120)),
    mpptMaxVoltage: positive(form.mpptMaxVoltage, positive(inverterMpptDefaults.mpptMaxVoltage, 450)),
    mpptStartupVoltage: positive(form.mpptStartupVoltage, positive(form.mpptMinVoltage, positive(inverterMpptDefaults.mpptStartupVoltage, 120))),
    mpptStartupToleranceV: nonNegative(form.mpptStartupToleranceV, nonNegative(inverterMpptDefaults.mpptStartupToleranceV, 0)),
    mpptMaxInputCurrent: positive(form.mpptMaxInputCurrent, positive(form.maxInputCurrentPerMpptA, positive(inverterMpptDefaults.mpptMaxInputCurrent, 100))),
    maxInputCurrentPerMpptA: positive(form.maxInputCurrentPerMpptA, positive(form.mpptMaxInputCurrent, positive(inverterMpptDefaults.maxInputCurrentPerMpptA, 100))),
    maxShortCircuitCurrentPerMpptA: positive(form.maxShortCircuitCurrentPerMpptA, positive(form.mpptMaxShortCircuitCurrent, positive(inverterMpptDefaults.maxShortCircuitCurrentPerMpptA, positive(form.mpptMaxInputCurrent, positive(inverterMpptDefaults.mpptMaxInputCurrent, 100)) * 1.25))),
    maxPvPowerPerMpptW: positive(form.maxPvPowerPerMpptW, positive(inverterMpptDefaults.maxPvPowerPerMpptW, 0)),
    maxPvPowerW: positive(form.maxPvPowerW, positive(inverterMpptDefaults.maxPvPowerW, 0)),
    maxDcAcRatio: positive(form.maxDcAcRatio, systemType === 'hybrid' ? 1.45 : systemType === 'offgrid' ? 1.3 : 1.4),
    panelIsc: positive(form.panelIsc, positive(form.panelShortCircuitCurrent, 0)),
    cableMaterial: form.cableMaterial || 'copper',
    cableInstallationMethod: form.cableInstallationMethod || 'conduit',
    cableAmbientTempC: parseFaNumber(form.cableAmbientTempC, parseFaNumber(form.maxTemperature, 40)),
    loadedCircuitsCount: positive(form.loadedCircuitsCount, 1),
    dcCableLength: positive(form.dcCableLength, 20),
    batteryCableLength: positive(form.batteryCableLength, 3),
    acCableLength: positive(form.acCableLength, 25),
    dcVoltageDropLimit: positive(form.dcVoltageDropLimit, 3),
    batteryVoltageDropLimit: positive(form.batteryVoltageDropLimit, 2),
    acVoltageDropLimit: positive(form.acVoltageDropLimit, 3),
    loadItems,
  };
}
