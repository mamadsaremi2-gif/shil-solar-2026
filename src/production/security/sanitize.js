export function sanitizeText(value = "") {
  return String(value)
    .replace(/[<>]/g, "")
    .trim();
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
