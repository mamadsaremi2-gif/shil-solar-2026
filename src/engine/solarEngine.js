export function calculatePanels(energyWh, sunHours, panelPower) {
  const energy = Number(energyWh || 0);
  const hours = Number(sunHours || 5);
  const power = Number(panelPower || 585);

  if (!energy || !hours || !power) return 0;

  return Math.ceil(energy / (hours * power));
}

export function calculateBattery(dailyEnergyWh, voltage, dod) {
  const energy = Number(dailyEnergyWh || 0);
  const v = Number(voltage || 48);
  const depth = Number(dod || 0.8);

  if (!energy || !v || !depth) return 0;

  return Math.ceil(energy / (v * depth));
}

export function calculateInverter(loadPower, surge = 1.3) {
  const load = Number(loadPower || 0);
  const s = Number(surge || 1.3);

  if (!load) return 0;

  return Math.ceil(load * s);
}

export function calculateVoltageDrop(current, length, area) {
  const i = Number(current || 0);
  const l = Number(length || 0);
  const a = Number(area || 1);
  const resistivity = 0.0175;

  return (2 * resistivity * l * i) / a;
}

export function runSolarSizing(data = {}) {
  const dailyUsageWh = Number(data.dailyUsage || 0);
  const sunHours = Number(data.sunHours || 5);
  const systemVoltage = Number(data.systemVoltage || 48);
  const panelPower = Number(data.panelPower || 585);
  const dod = Number(data.dod || 0.8);
  const surge = Number(data.surge || 1.3);

  const requiredEnergy = Math.ceil(dailyUsageWh * 1.2);
  const panelCount = calculatePanels(requiredEnergy, sunHours, panelPower);
  const inverterPower = calculateInverter(dailyUsageWh / 5 || 0, surge);
  const batteryCapacity = calculateBattery(dailyUsageWh, systemVoltage, dod);

  return {
    requiredEnergy,
    panelCount,
    inverterPower,
    batteryCapacity,
    systemVoltage,
    panelPower,
  };
}
