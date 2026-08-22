export function generateHourlyPVFromDailyEnergy(dailyEnergyWh, daylightStart = 6, daylightEnd = 18) {
  const hours = Array(24).fill(0);
  const daylightHours = daylightEnd - daylightStart;
  const weights = [];

  for (let i = 0; i < daylightHours; i += 1) {
    const x = Math.PI * (i + 0.5) / daylightHours;
    weights.push(Math.sin(x));
  }

  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  for (let i = 0; i < daylightHours; i += 1) {
    hours[daylightStart + i] = dailyEnergyWh * weights[i] / totalWeight;
  }

  return hours;
}
