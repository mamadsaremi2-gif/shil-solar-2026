export function runInverterEngine(form) {
  const { project, inverter } = form;
  const recommendedRatedPowerW = Math.ceil(project.peakLoadW * 1.25);
  const loadRatio = inverter.ratedPowerW > 0 ? project.peakLoadW / inverter.ratedPowerW : 0;

  return {
    recommendedRatedPowerW,
    selectedRatedPowerW: inverter.ratedPowerW,
    loadRatio,
    hasCapacityMargin: inverter.ratedPowerW >= recommendedRatedPowerW
  };
}
