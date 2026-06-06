import { batteryEnergyKWh, batterySeriesCountForInverter, batteryVoltageClass, isBatteryCompatibleWithInverter, isBatterySeriesCompatibleWithInverter, number, positive } from "../solar/solarBankRules.js";

const toNumber = number;

function emergencyBatteryEnergyWh(item = {}) {
  return batteryEnergyKWh(item) * 1000;
}

export function filterEmergencyInverters(inverters = [], requiredPowerW = 0) {
  const required = Math.max(0, toNumber(requiredPowerW, 0));
  return (Array.isArray(inverters) ? inverters : [])
    .filter((item) => {
      const type = String(item.type || item.systemType || "").toLowerCase();
      const hasBatteryBus = Boolean(item.batteryVoltage || item.dcVoltage || item.batteryMinVoltage || item.batteryMaxVoltage);
      const backupCapable = type.includes("off") || type.includes("hybrid") || hasBatteryBus;
      return backupCapable && toNumber(item.ratedPowerW || item.powerW, 0) >= Math.max(1, required * 0.8);
    })
    .sort((a, b) => toNumber(a.ratedPowerW || a.powerW, 0) - toNumber(b.ratedPowerW || b.powerW, 0));
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
    return group.includes("battery") || group.includes("ac") || group.includes("dc mccb") || group.includes("dcmccb") || group.includes("fuse") || group.includes("isolator");
  });
  const cableItems = (Array.isArray(cables) ? cables : []).filter((item) => {
    const side = String(item.side || item.title || "").toLowerCase();
    return side.includes("battery") || side.includes("dc") || side.includes("ac");
  });
  return { protections: protectionItems, cables: cableItems };
}

export function pickEmergencyInverter(inverters = [], requiredPowerW = 0) {
  const required = positive(requiredPowerW, 0);
  const filtered = filterEmergencyInverters(inverters, required);
  return filtered.find((item) => toNumber(item.ratedPowerW || item.powerW, 0) >= required) || filtered[0] || null;
}

export function pickEmergencyBattery(batteries = [], inverter = null, requiredEnergyKWh = 0) {
  const compatible = filterEmergencyBatteries(batteries, inverter, 0, { strictEnergy: false });
  const direct = compatible.filter((battery) => isBatteryCompatibleWithInverter(battery, inverter));
  return direct[0] || compatible[0] || null;
}
