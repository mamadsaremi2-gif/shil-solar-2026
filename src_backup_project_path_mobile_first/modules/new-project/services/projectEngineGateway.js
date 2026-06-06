import { runRules } from '../../../engine/index.js';

export function getProjectEngineResult(input = {}, options = {}) {
  return runRules(input, options);
}
