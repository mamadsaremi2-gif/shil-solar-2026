// SHIL clean active rule runner.
// Single entry point for engineering rules.
// Every rule is isolated with try/catch so one broken rule cannot crash pages.

import { ruleRegistry } from '../rules/index.js';
import { validateRuleInput } from '../validation/validateRuleInput.js';
import { createRuleTrace } from '../debug/ruleTrace.js';
import { mergeRuleResult } from '../utils/resultMerge.js';

export function runRules(input = {}, options = {}) {
  const trace = createRuleTrace('runRules');
  const safeInput = validateRuleInput(input);
  const enabledRules = Array.isArray(options.enabledRules) ? options.enabledRules : [];

  let results = {
    ok: true,
    mode: 'ACTIVE_ENGINE',
    calculationsEnabled: true,
    input: safeInput,
    equipment: safeInput.equipment || {},
    values: {},
    warnings: [],
    errors: [],
    explanations: [],
    appliedRules: [],
    skippedRules: [],
    trace: [],
  };

  for (const ruleName of enabledRules) {
    const rule = ruleRegistry[ruleName];
    if (!rule || typeof rule.run !== 'function') {
      results = mergeRuleResult(results, {
        warnings: [{ code: 'RULE_NOT_FOUND', ruleName, message: `Rule not found: ${ruleName}` }],
        skippedRules: [ruleName],
      });
      continue;
    }

    const startedAt = Date.now();
    try {
      const ruleResult = rule.run(safeInput, results, options);
      results = mergeRuleResult(results, {
        ...(ruleResult && typeof ruleResult === 'object' ? ruleResult : {}),
        appliedRules: [ruleName],
        trace: [{ rule: ruleName, ok: true, durationMs: Date.now() - startedAt }],
      });
    } catch (error) {
      results = mergeRuleResult(results, {
        ok: false,
        errors: [{ code: 'RULE_RUNTIME_ERROR', ruleName, message: error?.message || String(error) }],
        skippedRules: [ruleName],
        trace: [{ rule: ruleName, ok: false, durationMs: Date.now() - startedAt, message: error?.message || String(error) }],
      });
    }
  }

  results.trace = [...(results.trace || []), trace.finish()];
  return results;
}

export default runRules;
