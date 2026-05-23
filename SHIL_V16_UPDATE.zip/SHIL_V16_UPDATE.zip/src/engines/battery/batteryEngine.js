export function runBatteryEngine(form) {
  const { project, battery } = form;

  if (project.scenario === "ongrid") {
    return {
      requiredCapacityAh: 0,
      usableEnergyWh: 0,
      note: "Battery sizing skipped for ongrid scenario."
    };
  }

  const requiredEnergyWh = project.dailyEnergyWh * project.autonomyDays;
  const requiredCapacityAh = requiredEnergyWh / (
    battery.nominalVoltage * battery.depthOfDischarge * battery.roundTripEfficiency
  );

  const usableEnergyWh =
    battery.nominalVoltage *
    battery.capacityAh *
    battery.depthOfDischarge *
    battery.roundTripEfficiency;

  return {
    requiredEnergyWh,
    requiredCapacityAh,
    usableEnergyWh,
    autonomyCoverageDays: project.dailyEnergyWh > 0 ? usableEnergyWh / project.dailyEnergyWh : 0
  };
}
