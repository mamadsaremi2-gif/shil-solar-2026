import { createEngineContext } from './createEngineContext.js';
import { runRules } from './runRules.js';
import { ruleGroups } from '../rules/index.js';
import { createEngineResult } from '../contracts/engineResult.contract.js';
import { createOperationalStatus } from '../validation/operationalGuards.js';

// Main SHIL engineering engine gateway.
// Production rule execution is isolated from UI and guarded by operational status.
export function runEngine(input = {}, options = {}) {
  const context = createEngineContext(input, options);
  const groupName = options.group || 'systemSettings';
  const enabledRules = options.enabledRules || ruleGroups[groupName] || [];

  const ruleResult = runRules(context.input, {
    ...options,
    enabledRules,
  });

  const engineResult = createEngineResult({
    ...ruleResult,
    contextMeta: {
      group: groupName,
      profile: options.profile || 'SAFE_PRODUCTION',
      registryVersion: context.registry?.version || 'unknown',
      generatedAt: context.now,
    },
  });

  return {
    ...engineResult,
    operational: createOperationalStatus(engineResult, options),
  };
}

export default runEngine;
