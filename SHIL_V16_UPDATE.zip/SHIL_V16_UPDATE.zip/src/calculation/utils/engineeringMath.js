export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function safeDivide(a, b, fallback = 0) {
  return b === 0 || !Number.isFinite(b) ? fallback : a / b;
}

export function sum(values) {
  return values.reduce((total, item) => total + Number(item || 0), 0);
}

export function max(values) {
  return values.length ? Math.max(...values.map((item) => Number(item || 0))) : 0;
}

export function createRange(start, end, step = 1) {
  const values = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
}
