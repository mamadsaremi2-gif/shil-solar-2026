export function sizeInverter({
  peakLoadW,
  surgeLoadW = 0,
  marginFactor = 1.25,
  standardRatingsW = [1000, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000]
}) {
  const requiredRatedPowerW = Math.ceil(peakLoadW * marginFactor);
  const requiredSurgePowerW = Math.max(surgeLoadW, peakLoadW * 1.2);
  const selectedRatedPowerW =
    standardRatingsW.find((rating) => rating >= requiredRatedPowerW) ||
    standardRatingsW[standardRatingsW.length - 1];

  return {
    requiredRatedPowerW,
    requiredSurgePowerW,
    selectedRatedPowerW,
    marginFactor
  };
}
