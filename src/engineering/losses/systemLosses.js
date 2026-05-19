export function calculateSystemLosses({
  temperatureLoss = 6,
  cableLoss = 2,
  inverterLoss = 4,
  dustLoss = 3,
  mismatchLoss = 2,
  batteryLoss = 5,
}) {
  const totalLoss =
    temperatureLoss +
    cableLoss +
    inverterLoss +
    dustLoss +
    mismatchLoss +
    batteryLoss;

  const efficiency =
    100 - totalLoss;

  return {
    totalLoss,
    efficiency,
    status:
      efficiency >= 75
        ? "GOOD"
        : "CHECK",
  };
}
