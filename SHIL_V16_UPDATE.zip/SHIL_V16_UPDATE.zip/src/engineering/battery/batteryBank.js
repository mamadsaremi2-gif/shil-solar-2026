export function calculateBatteryBank({
  dailyEnergyWh = 0,
  autonomyHours = 8,
  averageLoadW = 1000,
  batteryVoltage = 48,
  dod = 0.8,
  efficiency = 0.92,
}) {
  const backupEnergyWh =
    averageLoadW * autonomyHours;

  const requiredWh =
    Math.max(dailyEnergyWh, backupEnergyWh);

  const batteryAh =
    requiredWh / batteryVoltage / dod / efficiency;

  const batteryKWh =
    batteryAh * batteryVoltage / 1000;

  return {
    requiredWh: Math.round(requiredWh),
    batteryAh: Math.ceil(batteryAh),
    batteryKWh: Number(batteryKWh.toFixed(2)),
  };
}
