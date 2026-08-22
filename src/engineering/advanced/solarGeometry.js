const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export function solarDeclination(dayOfYear) {
  return 23.45 * Math.sin(DEG * ((360 / 365) * (284 + dayOfYear)));
}

export function estimateOptimumTilt(latitude, mode = "annual") {
  const absLat = Math.abs(latitude);
  if (mode === "winter") return Math.min(absLat + 15, 60);
  if (mode === "summer") return Math.max(absLat - 15, 0);
  return Math.min(absLat * 0.9 + 3, 55);
}

export function estimateIrradianceTiltFactor({ latitude, tilt, dayOfYear = 172 }) {
  const declination = solarDeclination(dayOfYear);
  const incidence = Math.abs(latitude - declination - tilt);
  return Math.max(0.65, Math.cos(incidence * DEG));
}

export function estimateMonthlyTiltFactors(latitude, tilt) {
  const monthMidDays = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  return monthMidDays.map((dayOfYear, index) => ({
    month: index + 1,
    factor: estimateIrradianceTiltFactor({ latitude, tilt, dayOfYear })
  }));
}
