export function calculateBattery(
  dailyEnergy,
  voltage,
  dod
) {

  return Math.ceil(
    dailyEnergy /
    (voltage * dod)
  );
}
