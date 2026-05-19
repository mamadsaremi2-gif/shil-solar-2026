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
  const unitEnergyWh = nominalVoltage * moduleCapacityAh;
  const unitEnergyKWh = Math.round((unitEnergyWh / 1000) * 100) / 100;
  const grossEnergyKWh = Math.round(((nominalVoltage * installedAh) / 1000) * 100) / 100;
  const usableEnergyKWh = Math.round((usableWh / 1000) * 100) / 100;

  return {
    requiredWh,
    requiredAh,
    moduleCapacityAh,
    moduleCount,
    batteryCount: moduleCount,
    totalCount: moduleCount,
    nominalVoltage,
    unitVoltageV: nominalVoltage,
    voltageV: nominalVoltage,
    unitCapacityAh: moduleCapacityAh,
    capacityAh: moduleCapacityAh,
    unitEnergyKWh,
    installedAh,
    bankCurrentAh: installedAh,
    grossEnergyKWh,
    usableEnergyKWh,
    usableWh,
    autonomyCoverageDays: dailyEnergyWh > 0 ? usableWh / dailyEnergyWh : 0
  };
}
