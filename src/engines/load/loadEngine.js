export function runLoadEngine(form) {
  const { project } = form;
  return {
    dailyEnergyWh: project.dailyEnergyWh,
    peakLoadW: project.peakLoadW,
    averagePowerW: project.dailyEnergyWh / 24
  };
}
