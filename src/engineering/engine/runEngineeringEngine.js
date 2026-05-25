import { runUnifiedEngineForLegacyUI } from "../../calculationGateway/legacyEngineeringAdapter.js";

export function runEngineeringEngine(input = {}, options = {}) {
  return runUnifiedEngineForLegacyUI(input, {
    ...options,
    source: options.source || "engineering-engine-legacy-entrypoint",
  });
}
