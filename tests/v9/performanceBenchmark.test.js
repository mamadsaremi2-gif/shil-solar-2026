import { BenchmarkService } from "../../src/qa/performance/BenchmarkService.js";
import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createScenarioMatrix } from "../../src/qa/scenarios/scenarioFactory.js";
import { assert } from "../fixtures.js";

const benchmark = new BenchmarkService();
const scenarios = createScenarioMatrix();

const result = await benchmark.measure("scenario-matrix", () => {
  return scenarios.map((form) => runEngineeringPipeline(form, { stopOnValidationError: false }));
}, 3);

assert(result.iterations === 3, "Benchmark should record iterations.");
assert(result.averageMs >= 0, "Benchmark should calculate average time.");
assert(benchmark.summary().count === 1, "Benchmark summary should count results.");

console.log("performanceBenchmark.test passed");
