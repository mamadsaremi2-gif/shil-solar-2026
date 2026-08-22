export function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function round(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const factor = Math.pow(10, digits);
  return Math.round(num * factor) / factor;
}

export function ceilTo(value, step = 1) {
  const num = n(value, 0);
  const s = n(step, 1) || 1;
  return Math.ceil(num / s) * s;
}

export function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}
