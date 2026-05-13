import { PerformanceBudgetService } from "../../src/production/performance/PerformanceBudgetService.js";
import { FeatureFlagService } from "../../src/production/flags/FeatureFlagService.js";
import { assert } from "../fixtures.js";

const budget = new PerformanceBudgetService({ calculationMs: 100 });
const ok = budget.evaluate({ calculationMs: 50 });
const bad = budget.evaluate({ calculationMs: 150 });

assert(ok.passed === true, "Performance budget should pass fast measurement.");
assert(bad.passed === false, "Performance budget should fail slow measurement.");

const flags = new FeatureFlagService({
  testFeature: { enabled: true, rolloutPercent: 100 }
});
assert(flags.isEnabled("testFeature", { userId: "u1" }) === true, "Feature flag should enable full rollout.");
flags.setFlag("testFeature", { rolloutPercent: 0 });
assert(flags.isEnabled("testFeature", { userId: "u1" }) === false, "Feature flag should disable zero rollout.");

console.log("performanceBudget.test passed");
