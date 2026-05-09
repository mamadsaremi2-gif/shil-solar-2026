export function formatNumber(value, digits = 0) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(num);
}

export function formatLabel(value) {
  return value ?? "—";
}
