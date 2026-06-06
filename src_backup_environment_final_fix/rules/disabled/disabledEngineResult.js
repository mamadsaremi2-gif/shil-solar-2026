export function createDisabledEngineResult(source = "unknown", extra = {}) {
  return {
    status: "disabled",
    valid: true,
    canContinue: true,
    engine: source,
    calculationDisabled: true,
    result: {},
    summary: { important_results: {}, warnings: [] },
    warnings: [],
    explanations: ["موتور محاسبات در نسخه پاکسازی‌شده غیرفعال است و بعداً از src/rules دوباره تعریف می‌شود."],
    ...extra,
  };
}
