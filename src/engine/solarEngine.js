export function runSolarSizing(data) {

  const dailyUsage =
    Number(data.dailyUsage || 0);

  const sunHours =
    Number(data.sunHours || 5);

  const systemVoltage =
    Number(data.systemVoltage || 48);

  const panelPower = 585;

  const requiredEnergy =
    dailyUsage * 1.2;

  const panelCount =
    Math.ceil(
      requiredEnergy /
      (panelPower * sunHours)
    );

  const inverterPower =
    Math.ceil(dailyUsage * 1.35);

  const batteryCapacity =
    Math.ceil(
      (dailyUsage * 1000) /
      systemVoltage
    );

  return {
    requiredEnergy,
    panelCount,
    inverterPower,
    batteryCapacity,
  };
}
