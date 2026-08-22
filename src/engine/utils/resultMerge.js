export function mergeRuleResult(base = {}, patch = {}) {
  return {
    ...base,
    ...patch,
    values: { ...(base.values || {}), ...(patch.values || {}) },
    equipment: { ...(base.equipment || {}), ...(patch.equipment || {}) },
    warnings: [...(base.warnings || []), ...(patch.warnings || [])],
    errors: [...(base.errors || []), ...(patch.errors || [])],
    explanations: [...(base.explanations || []), ...(patch.explanations || [])],
    skippedRules: [...(base.skippedRules || []), ...(patch.skippedRules || [])],
    appliedRules: [...(base.appliedRules || []), ...(patch.appliedRules || [])],
    trace: [...(base.trace || []), ...(patch.trace || [])],
  };
}
