export function toEnglishDigits(value) {
  return String(value || "").replace(/[Û°-Û¹]/g, (d) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(d));
}
