const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function filterEmergencyInverters(inverters = [], requiredPowerW = 0) {
  const required = Math.max(0, toNumber(requiredPowerW, 0));
  return inverters
    .filter((item) => {
      const type = String(item.type || item.systemType || "").toLowerCase();
      const hasBatteryBus = Boolean(item.batteryVoltage || item.dcVoltage || item.batteryMinVoltage || item.batteryMaxVoltage);
      const backupCapable = type.includes("off") || type.includes("hybrid") || hasBatteryBus;
      return backupCapable && toNumber(item.ratedPowerW, 0) >= Math.max(1, required * 0.8);
    })
    .sort((a, b) => toNumber(a.ratedPowerW, 0) - toNumber(b.ratedPowerW, 0));
}

export function filterEmergencyBatteries(batteries = [], inverter = null, requiredEnergyKWh = 0) {
  const dcVoltage = toNumber(inverter?.dcVoltage || inverter?.batteryVoltage || inverter?.nominalDcVoltage, 0);
  const requiredWh = Math.max(0, toNumber(requiredEnergyKWh, 0) * 1000);
  return batteries
    .filter((item) => {
      const chemistry = String(item.chemistry || item.type || "").toLowerCase();
      const voltage = toNumber(item.nominalVoltage || item.voltageV, 0);
      const energyWh = toNumber(item.energyWh || voltage * toNumber(item.capacityAh, 0), 0);
      const chemistryOk = chemistry.includes("lifepo") || chemistry.includes("lfp") || chemistry.includes("lithium");
      const voltageOk = !dcVoltage || Math.abs(voltage - dcVoltage) <= Math.max(4, dcVoltage * 0.12);
      return chemistryOk && voltageOk && energyWh > 0 && energyWh >= Math.max(1, requiredWh * 0.15);
    })
    .sort((a, b) => toNumber(a.energyWh || a.nominalVoltage * a.capacityAh, 0) - toNumber(b.energyWh || b.nominalVoltage * b.capacityAh, 0));
}

export function selectEmergencyProtection(protections = [], cables = []) {
  const protectionItems = protections.filter((item) => {
    const group = String(item.group || item.side || item.deviceType || "").toLowerCase();
    return group.includes("battery") || group.includes("ac") || group.includes("dcMccb".toLowerCase()) || group.includes("fuse") || group.includes("isolator");
  });
  const cableItems = cables.filter((item) => {
    const side = String(item.side || item.title || "").toLowerCase();
    return side.includes("battery") || side.includes("dc") || side.includes("ac");
  });
  return { protections: protectionItems, cables: cableItems };
}

export function pickEmergencyInverter(inverters = [], requiredPowerW = 0) {
  const filtered = filterEmergencyInverters(inverters, requiredPowerW);
  return filtered.find((item) => toNumber(item.ratedPowerW, 0) >= requiredPowerW) || filtered[filtered.length - 1] || inverters[0] || null;
}

export function pickEmergencyBattery(batteries = [], inverter = null, requiredEnergyKWh = 0) {
  const filtered = filterEmergencyBatteries(batteries, inverter, requiredEnergyKWh);
  return filtered.find((item) => toNumber(item.energyWh || item.nominalVoltage * item.capacityAh, 0) / 1000 >= requiredEnergyKWh) || filtered[filtered.length - 1] || batteries[0] || null;
}
