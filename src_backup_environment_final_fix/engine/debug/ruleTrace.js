export function createRuleTrace(scope = 'engine') {
  const startedAt = Date.now();
  const events = [];

  return {
    add(event, payload = {}) {
      events.push({ event, payload, at: Date.now() });
    },
    finish() {
      return { scope, durationMs: Date.now() - startedAt, events };
    },
  };
}
