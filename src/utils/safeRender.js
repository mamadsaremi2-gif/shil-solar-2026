export function formatEngineeringText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  let text = String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  const canonical = {
    kwh: "KWH", kw: "KW", wh: "WH", ah: "AH",
    vac: "VAC", vdc: "VDC", ma: "MA", a: "A", v: "V", w: "W",
    h: "H", m: "M", deg: "DEG"
  };
  const unitPattern = "KWH|KW|WH|AH|VAC|VDC|MA|MM²|MM2|DEG|H|A|V|W|M|%";

  text = text.replace(/\b(kwh|kw|wh|ah|vac|vdc|ma|mm²|mm2|deg|h|a|v|w|m)\b/gi, (m) => canonical[m.toLowerCase()] || m.toUpperCase());
  text = text.replace(new RegExp(`\\b(${unitPattern})\\s*([+-]?\\d+(?:[.,]\\d+)?)`, "g"), (_m, unit, number) => `${number} ${unit}`);
  text = text.replace(new RegExp(`([+-]?\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\b`, "g"), (_m, number, unit) => `${number} ${unit}`);
  // Keep all displayed numerals in English and force engineering units after the number.
  // Mixed Persian/English phrases are separated with a slash so bidi order stays predictable.
  text = text
    .replace(/\s*[|•·]\s*/g, " / ")
    .replace(/([\u0600-\u06FF])\s+([A-Za-z][A-Za-z0-9+_.-]*)/g, "$1 / $2")
    .replace(/([A-Za-z][A-Za-z0-9+_.-]*)\s+([\u0600-\u06FF])/g, "$1 / $2")
    .replace(/\s*\/\s*\/\s*/g, " / ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text || fallback;
}

export function safeText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return formatEngineeringText(value, fallback);
  if (Array.isArray(value)) return value.map((item) => safeText(item, "")).filter(Boolean).join("، ") || fallback;
  if (typeof value === "object") {
    const preferred = value.message || value.label || value.title || value.name || value.value || value.reason || value.rule || value.code || value.type;
    if (preferred !== undefined && preferred !== value) return safeText(preferred, fallback);
    try {
      return Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${safeText(v, "")}`)
        .join(" / ") || fallback;
    } catch {
      return fallback;
    }
  }
  return formatEngineeringText(value, fallback);
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
  return safeText(value, "");
}
