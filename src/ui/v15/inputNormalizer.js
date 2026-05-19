const persianDigits = "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹";
const arabicDigits = "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©";

export function normalizeDigits(value = "") {
  return String(value)
    .replace(/[Û°-Û¹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/[Ù -Ù©]/g, (d) => String(arabicDigits.indexOf(d)));
}

export function normalizeEngineeringInput(value = "") {
  return normalizeDigits(value)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/kw/gi, "kW")
    .replace(/kwh/gi, "kWh")
    .replace(/wh/gi, "Wh")
    .replace(/ah/gi, "Ah");
}

export function parseEngineeringNumber(value) {
  const normalized = normalizeDigits(value).replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
