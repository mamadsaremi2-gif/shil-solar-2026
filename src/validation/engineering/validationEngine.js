import { validateProjectRules } from "./rules/projectRules.js";
import { validatePVRules, getPVValidationMetrics } from "./rules/pvRules.js";
import { validateBatteryRules } from "./rules/batteryRules.js";
import { validateInverterRules } from "./rules/inverterRules.js";
import { validateCableRules } from "./rules/cableRules.js";
import { validateLossRules } from "./rules/lossRules.js";

const RULE_GROUPS = [
  validateProjectRules,
  validatePVRules,
  validateBatteryRules,
  validateInverterRules,
  validateCableRules,
  validateLossRules
];

export function validateEngineeringForm(form) {
  const messages = RULE_GROUPS.flatMap((rule) => rule(form || {}));
  const errors = messages.filter((item) => item.severity === "error");
  const warnings = messages.filter((item) => item.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      pv: getPVValidationMetrics(form || {})
    }
  };
}
