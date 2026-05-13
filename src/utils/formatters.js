export function formatNumber(value) {

  return new Intl.NumberFormat(
    "fa-IR"
  ).format(value);
}

export function formatCurrency(value) {

  return new Intl.NumberFormat(
    "fa-IR",
    {
      style: "currency",
      currency: "IRR",
    }
  ).format(value);
}
