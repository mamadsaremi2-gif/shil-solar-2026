export function formatNumber(value) {
  return new Intl.NumberFormat("fa-IR").format(value || 0);
}
