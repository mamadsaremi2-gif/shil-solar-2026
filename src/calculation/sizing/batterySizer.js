export function sizeBatteryBank({
  dailyEnergyWh,
  autonomyDays = 1,
  nominalVoltage = 48,
  depthOfDischarge = 0.8,
  roundTripEfficiency = 0.9,
  moduleCapacityAh = 100
}) {
  const requiredWh = dailyEnergyWh * autonomyDays;
  const requiredAh = requiredWh / (nominalVoltage * depthOfDischarge * roundTripEfficiency);
  const moduleCount = Math.ceil(requiredAh / moduleCapacityAh);
  const installedAh = moduleCount * moduleCapacityAh;
  const usableWh = installedAh * nominalVoltage * depthOfDischarge * roundTripEfficiency;

  return {
    requiredWh,
    requiredAh,
    moduleCapacityAh,
    moduleCount,
    installedAh,
    usableWh,
    autonomyCoverageDays: dailyEnergyWh > 0 ? usableWh / dailyEnergyWh : 0
  };
}
