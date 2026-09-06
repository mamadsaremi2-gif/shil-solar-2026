import { batteryEnergyKWh, batterySeriesCountForInverter, batteryVoltageClass, isBatteryCompatibleWithInverter, isBatterySeriesCompatibleWithInverter, number, positive } from "../solar/solarBankRules.js";

const toNumber = number;

function emergencyBatteryEnergyWh(item = {}) {
  return batteryEnergyKWh(item) * 1000;
}

function normalizeEmergencyPhase(value = "") {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("three") || raw.includes("3p") || raw === "3" || raw.includes("سه")) return "three";
  if (raw.includes("single") || raw.includes("1p") || raw === "1" || raw.includes("تک")) return "single";
  return "";
}

function emergencyInverterPhase(item = {}) {
  const explicit = normalizeEmergencyPhase(item.phaseAC || item.phase || item.outputPhase || item.phases || item.phaseType);
  if (explicit) return explicit;
  const outputV = toNumber(item.outputVoltage || item.outputVoltageV || item.acVoltage || item.ratedAcVoltageV, 0);
  return outputV >= 380 ? "three" : "single";
}

function validEmergencyDcBus(item = {}) {
  return toNumber(item.batteryVoltage || item.dcVoltage || item.nominalDcVoltage || item.batteryVoltageV, 0);
}

function isLowVoltageBatteryInverter(item = {}) {
  const dc = validEmergencyDcBus(item);
  const architecture = String(item.batteryArchitecture || "").toUpperCase();
  return architecture === "LV" || (dc >= 40 && dc <= 60);
}

function isBatteryBackedEmergencyInverter(item = {}) {
  const type = String(item.type || item.systemType || item.series || "").toLowerCase();
  const dcBus = validEmergencyDcBus(item);
  const pvOnly = item.noBatteryRequired === true || item.batteryRequired === false || item.gridTieOnly === true || type.includes("on grid") || type.includes("ongrid") || type.includes("string inverter") || type === "utility";
  const emergencyCapable = item.emergencyOnly === true || item.backupCapable === true || type.includes("off") || type.includes("hybrid") || type.includes("ups") || type.includes("emergency");
  return !pvOnly && emergencyCapable && dcBus > 0;
}

export function filterEmergencyInverters(inverters = [], requiredPowerW = 0, options = {}) {
  const requestedPhase = normalizeEmergencyPhase(options.phaseAC || options.phase || (toNumber(options.voltageAC, 0) >= 380 ? "three" : "single"));
  return (Array.isArray(inverters) ? inverters : [])
    .filter((item) => {
      if (!isBatteryBackedEmergencyInverter(item)) return false;
      if (requestedPhase && emergencyInverterPhase(item) !== requestedPhase) return false;
      if (requestedPhase === "three" && !isLowVoltageBatteryInverter(item)) return false;
      return toNumber(item.ratedPowerW || item.powerW, 0) > 0;
    })
    .sort((a, b) => toNumber(a.ratedPowerW || a.powerW, 0) - toNumber(b.ratedPowerW || b.powerW, 0));
}

export function emergencyInverterParallelCount(item = {}, requiredPowerW = 0) {
  const rated = Math.max(1, toNumber(item.ratedPowerW || item.powerW, 0));
  const required = Math.max(0, toNumber(requiredPowerW, 0));
  return Math.max(1, Math.ceil(required / rated));
}

export function pickEmergencyInverter(inverters = [], requiredPowerW = 0, options = {}) {
  const required = positive(requiredPowerW, 0);
  const filtered = filterEmergencyInverters(inverters, required, options);
  const ranked = filtered
    .filter((item) => emergencyInverterParallelCount(item, required) === 1 || item.parallelCapable !== false)
    .map((item) => {
      const rated = Math.max(1, toNumber(item.ratedPowerW || item.powerW, 0));
      const count = emergencyInverterParallelCount(item, required);
      const installed = rated * count;
      return { item, count, installed, oversize: Math.max(0, installed - required) };
    })
    .sort((a, b) => a.count - b.count || a.oversize - b.oversize || b.item.ratedPowerW - a.item.ratedPowerW);
  return ranked[0]?.item || null;
}

export function filterEmergencyBatteries(batteries = [], inverter = null, requiredEnergyKWh = 0, options = {}) {
  const requiredWh = Math.max(0, toNumber(requiredEnergyKWh, 0) * 1000);
  const strictEnergy = options.strictEnergy === true;

  return (Array.isArray(batteries) ? batteries : [])
    .filter((item) => {
      const chemistry = String(item.chemistry || item.type || "").toLowerCase();
      const energyWh = emergencyBatteryEnergyWh(item);
      const chemistryOk = chemistry.includes("lifepo") || chemistry.includes("lfp") || chemistry.includes("lithium");
      const voltageOk = !inverter || isBatterySeriesCompatibleWithInverter(item, inverter);
      const seriesCount = inverter ? batterySeriesCountForInverter(item, inverter) : 1;
      const stringEnergyWh = energyWh * Math.max(1, seriesCount);
      const energyOk = strictEnergy ? stringEnergyWh >= Math.max(1, requiredWh) : energyWh > 0;
      return chemistryOk && voltageOk && energyWh > 0 && energyOk;
    })
    .sort((a, b) => toNumber(a.capacityAh, 0) - toNumber(b.capacityAh, 0) || emergencyBatteryEnergyWh(a) - emergencyBatteryEnergyWh(b));
}

export function selectEmergencyProtection(protections = [], cables = []) {
  const protectionItems = (Array.isArray(protections) ? protections : []).filter((item) => {
    const group = String(item.group || item.side || item.deviceType || "").toLowerCase();
    return group.includes("battery") || group.includes("ac") || group.includes("dc mccb") || group.includes("dcmccb") || group.includes("fuse") || group.includes("isolator") || group.includes("disconnect");
  });
  const cableItems = (Array.isArray(cables) ? cables : []).filter((item) => {
    const side = String(item.side || item.title || "").toLowerCase();
    return side.includes("battery") || side.includes("dc") || side.includes("ac");
  });
  return { protections: protectionItems, cables: cableItems };
}

export function pickEmergencyBattery(batteries = [], inverter = null, requiredEnergyKWh = 0) {
  const compatible = filterEmergencyBatteries(batteries, inverter, 0, { strictEnergy: false });
  const direct = compatible.filter((battery) => isBatteryCompatibleWithInverter(battery, inverter));
  return direct[0] || compatible[0] || null;
}
