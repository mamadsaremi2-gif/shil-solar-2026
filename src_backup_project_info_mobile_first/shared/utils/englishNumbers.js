export function toEnglishDigits(value = "") {
  return String(value ?? "")
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function formatNumberEN(value, digits = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return toEnglishDigits(n.toLocaleString("en-US", { maximumFractionDigits: digits }));
}

export function normalizeDisplayText(value = "") {
  return toEnglishDigits(value);
}
