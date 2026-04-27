import { parseFaNumber } from "../../../shared/utils/faNumbers.js";

function positive(value, fallback = 0) {
  const n = parseFaNumber(value, fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bounded(value, fallback, min, max) {
  const n = parseFaNumber(value, fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

const BACKUP_SYSTEM_VOLTAGES = [12, 24, 48];
const BATTERY_UNIT_VOLTAGES = [12, 24, 48];

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
    surgeFactor: positive(item.surgeFactor, 1),
    loadType: item.loadType || "mixed",
  }));

  const loadProfile = (form.loadProfile || []).map((slot, index) => ({
    id: slot.id ?? `hour-${index}`,
    hour: Number.isInteger(slot.hour) ? slot.hour : index,
    label: slot.label || `${String(index).padStart(2, "0")}:00`,
    factor: bounded(slot.factor, 0.5, 0, 3),
  }));

  const systemType = form.systemType || "offgrid";
  const safeBackupHours = systemType === "gridtie" ? positive(form.backupHours, 1) : positive(form.backupHours, 4);
  const normalizedSystemVoltage = systemType === "backup"
    ? nearestAllowed(form.systemVoltage, BACKUP_SYSTEM_VOLTAGES, 24)
    : positive(form.systemVoltage, 48);
  const normalizedBatteryUnitVoltage = systemType === "backup"
    ? nearestAllowed(form.batteryUnitVoltage, BATTERY_UNIT_VOLTAGES, 12)
    : positive(form.batteryUnitVoltage, 12);

  return {
    ...form,
    systemType,
    hybridMode: form.hybridMode || "self_consumption",
    targetOffsetPercent: bounded(form.targetOffsetPercent, 85, 10, 150),
    gridAvailableHours: bounded(form.gridAvailableHours, 24, 1, 24),
    loadVoltage: positive(form.loadVoltage, 220),
    current: positive(form.current),
    loadPower: positive(form.loadPower),
    powerFactor: bounded(form.powerFactor, 0.95, 0.5, 1),
    backupHours: safeBackupHours,
    dailyEnergyKwh: positive(form.dailyEnergyKwh),
    peakFactor: positive(form.peakFactor, 2),
    loadProfileSource: form.loadProfileSource || "template",
    loadProfile,
    sunHours: positive(form.sunHours, 5),
    systemVoltage: normalizedSystemVoltage,
    batteryUnitVoltage: normalizedBatteryUnitVoltage,
    batteryUnitAh: positive(form.batteryUnitAh, 200),
    batteryRoundTripEfficiency: bounded(form.batteryRoundTripEfficiency, 0.95, 0.5, 1),
    daysAutonomy: positive(form.daysAutonomy, 1),
    dod: bounded(form.dod, 0.8, 0.1, 0.95),
    inverterEfficiency: bounded(form.inverterEfficiency, 0.93, 0.5, 1),
    controllerEfficiency: bounded(form.controllerEfficiency, 0.95, 0.5, 1),
    cableLossFactor: bounded(form.cableLossFactor, 0.97, 0.5, 1),
    panelLossFactor: bounded(form.panelLossFactor, 0.9, 0.5, 1),
    designFactor: positive(form.designFactor, 1.2),
    surgeFactor: positive(form.surgeFactor, 1.5),
    panelWatt: positive(form.panelWatt, 585),
    panelVoc: positive(form.panelVoc, 53.1),
    panelVmp: positive(form.panelVmp, 44.8),
    panelTempCoeffVoc: positive(form.panelTempCoeffVoc, 0.0024),
    panelTypeTemperatureFactor: positive(form.panelTypeTemperatureFactor, 0.29),
    averageTemperature: parseFaNumber(form.averageTemperature, 30),
    minTemperature: parseFaNumber(form.minTemperature, 0),
    maxTemperature: parseFaNumber(form.maxTemperature, 40),
    altitude: positive(form.altitude, 0),
    shadingFactor: bounded(form.shadingFactor, 0.95, 0.5, 1),
    dustFactor: bounded(form.dustFactor, 0.96, 0.5, 1),
    tiltAngle: positive(form.tiltAngle, 30),
    controllerMaxVoc: positive(form.controllerMaxVoc, 250),
    mpptMinVoltage: positive(form.mpptMinVoltage, 120),
    mpptMaxVoltage: positive(form.mpptMaxVoltage, 220),
    dcCableLength: positive(form.dcCableLength, 20),
    batteryCableLength: positive(form.batteryCableLength, 3),
    acCableLength: positive(form.acCableLength, 25),
    dcVoltageDropLimit: positive(form.dcVoltageDropLimit, 3),
    batteryVoltageDropLimit: positive(form.batteryVoltageDropLimit, 2),
    acVoltageDropLimit: positive(form.acVoltageDropLimit, 3),
    loadItems,
  };
}
