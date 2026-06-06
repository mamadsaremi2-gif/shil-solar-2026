export const units = {
  whToKwh: (wh) => wh / 1000,
  kwhToWh: (kwh) => kwh * 1000,
  percentToFactor: (percent) => percent / 100,
  factorToPercent: (factor) => factor * 100,
  round: (value, decimals = 2) => Number.parseFloat(Number(value || 0).toFixed(decimals)),
  ceilToStep: (value, step = 1) => Math.ceil(value / step) * step
};
