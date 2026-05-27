export function safeText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => safeText(item, "")).filter(Boolean).join("، ") || fallback;
  if (typeof value === "object") {
    const preferred = value.message || value.label || value.title || value.name || value.value || value.reason || value.rule || value.code || value.type;
    if (preferred !== undefined && preferred !== value) return safeText(preferred, fallback);
    try {
      return Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${safeText(v, "")}`)
        .join(" | ") || fallback;
    } catch {
      return fallback;
    }
  }
  return String(value);
}

export function safeList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => safeText(item, "")).filter(Boolean);
}

export function safeKey(value, index = 0) {
  return `${index}-${safeText(value, "item").slice(0, 80)}`;
}

export function toFaDigits(value) {
  return safeText(value, "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
