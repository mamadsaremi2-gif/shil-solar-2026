export function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function sum(values = []) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

export function safeDivide(numerator, denominator, fallback = 0) {
  if (!denominator) return fallback;
  return numerator / denominator;
}
