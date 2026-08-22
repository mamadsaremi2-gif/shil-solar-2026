// SHIL central rule registry
// وضعیت فعلی: موتور محاسبات عمداً پاکسازی و غیرفعال شده است.
// از این به بعد هر قانون جدید فقط باید اینجا یا زیرپوشه src/rules اضافه شود.
export const SHIL_RULE_ENGINE_STATUS = Object.freeze({
  enabled: false,
  version: "clean-reset-1.0.0",
  reason: "Calculation/rule engine removed for safe rebuild and maintainability.",
});

export const SHIL_RULE_PARTITIONS = Object.freeze({
  projectInfo: [],
  routeSelection: [],
  environment: [],
  calculationInput: [],
  systemSettings: [],
  finalCalculation: [],
  report: [],
});

export function getRules(partitionName = "") {
  return SHIL_RULE_PARTITIONS[partitionName] || [];
}

export function isRuleEngineEnabled() {
  return SHIL_RULE_ENGINE_STATUS.enabled === true;
}
