// SHIL Rule Contract
// Every future engineering rule must follow this shape.

export const RULE_SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  BLOCKER: 'blocker',
});

export function createRule({
  id,
  title,
  group = 'general',
  enabled = false,
  version = '1.0.0',
  inputKeys = [],
  outputKeys = [],
  run,
}) {
  if (!id || typeof id !== 'string') throw new Error('Rule id is required.');
  if (typeof run !== 'function') throw new Error(`Rule ${id} must define run(context).`);

  return Object.freeze({
    id,
    title: title || id,
    group,
    enabled: Boolean(enabled),
    version,
    inputKeys: Object.freeze([...inputKeys]),
    outputKeys: Object.freeze([...outputKeys]),
    run,
  });
}

export function createDisabledRule(id, title, group = 'disabled') {
  return createRule({
    id,
    title,
    group,
    enabled: false,
    run: (context) => ({
      ok: true,
      skipped: true,
      ruleId: id,
      message: 'Rule is intentionally disabled until the new calculation engine is implemented.',
      context,
    }),
  });
}

export function isRuleEnabled(rule) {
  return Boolean(rule && rule.enabled === true && typeof rule.run === 'function');
}
