export function forecastEnergy({
  dailyEnergy = 58,
  days = 7,
  weatherFactor = 0.92,
}) {
  return Array.from({ length: days }).map((_, index) => {
    const variation = 0.9 + Math.random() * 0.18;

    return {
      day: index + 1,
      energy: Number((dailyEnergy * weatherFactor * variation).toFixed(2)),
    };
  });
}
