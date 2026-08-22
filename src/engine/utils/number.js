export function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[٬,]/g, '').trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function positiveNumber(value, fallback = 0) {
  const n = toNumber(value, fallback);
  return n > 0 ? n : fallback;
}

export function round(value, digits = 2) {
  const n = toNumber(value, 0);
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

export function ceil(value, min = 0) {
  const n = Math.ceil(toNumber(value, 0));
  return Math.max(n, min);
}

export function clamp(value, min, max) {
  const n = toNumber(value, min);
  return Math.min(Math.max(n, min), max);
}
