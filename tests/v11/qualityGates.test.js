import { QualityGateService } from "../../src/qa/gates/QualityGateService.js";
import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const result = runEngineeringPipeline(createValidOffgridFixture());
const gates = new QualityGateService({
  minimumHealthScore: 70,
  maximumErrors: 0,
  maximumWarnings: 10,
  requiredTraceItems: ["engine:pv", "engine:advanced"]
});

const evaluation = gates.evaluateResult(result);
assert(evaluation.passed === true, "Quality gate should pass valid result.");

const failed = gates.evaluateResult({
  errors: [{ message: "bad" }],
  warnings: [],
  health: { score: 20 },
  trace: []
});
assert(failed.passed === false, "Quality gate should fail poor result.");
assert(failed.failures.length >= 2, "Quality gate should report multiple failures.");

console.log("qualityGates.test passed");
