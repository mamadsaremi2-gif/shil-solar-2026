import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createScenarioMatrix } from "../../src/qa/scenarios/scenarioFactory.js";
import { assert } from "../fixtures.js";

const scenarios = createScenarioMatrix();
const results = scenarios.map((form) => runEngineeringPipeline(form, { stopOnValidationError: false }));

assert(results.length >= 5, "Stress matrix should include multiple scenarios.");
assert(results.every((result) => result.outputs && result.trace.length > 0), "Every stress scenario should produce trace/output.");
assert(results.some((result) => result.diagnostics.length > 0 || result.errors.length > 0), "Stress matrix should include at least one issue scenario.");

console.log("stressScenarios.test passed");
