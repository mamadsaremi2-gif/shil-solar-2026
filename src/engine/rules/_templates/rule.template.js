import { createRule, RULE_SEVERITY } from '../../contracts/ruleContract.js';

// Copy this file when adding a new SHIL rule.
// Rules must be pure functions: no UI access, no localStorage, no direct navigation.

export const exampleRule = createRule({
  id: 'example.rule',
  title: 'Example safe rule',
  group: 'example',
  enabled: false,
  inputKeys: ['project', 'equipment'],
  outputKeys: ['warnings', 'explanations'],
  run: (context) => {
    const input = context?.input || {};

    if (!input.project) {
      return {
        ok: true,
        warnings: [{
          code: 'PROJECT_INPUT_MISSING',
          severity: RULE_SEVERITY.INFO,
          message: 'Project input is missing; rule skipped safely.',
        }],
      };
    }

    return {
      ok: true,
      explanations: [{ code: 'EXAMPLE_RULE_OK', message: 'Example rule executed safely.' }],
    };
  },
});
