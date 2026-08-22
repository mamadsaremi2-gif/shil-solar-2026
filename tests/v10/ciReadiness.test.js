import { CIReadinessChecker } from "../../src/qa/ci/CIReadinessChecker.js";
import packageJson from "../../package.json" with { type: "json" };
import { assert } from "../fixtures.js";

const checker = new CIReadinessChecker({ packageJson });
const report = checker.run();

assert(report.ok === true, "CI readiness should pass required metadata and scripts.");
assert(report.scripts.missing.length === 0, "CI readiness should have no missing scripts.");

console.log("ciReadiness.test passed");
