const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String(FA_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(AR_DIGITS.indexOf(digit)))
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
    .replace(/,/g, '');
}

export function parseFaNumber(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const normalized = toEnglishDigits(value).trim();
  if (!normalized) return fallback;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}
