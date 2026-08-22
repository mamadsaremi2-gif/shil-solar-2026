import assert from "node:assert/strict";
import { runEngineeringDesign } from "../../src/core/engineering/orchestrator/runEngineeringDesign.js";

const result = await runEngineeringDesign({
  projectInfo: { projectTitle: "Test Project" },
  environment: { city: "Tehran" },
  projectPath: { pathType: "pv", pvScenario: "offgrid" },
  calculationMethod: { method: "equipment-list" },
  calculationInputs: {},
  systemSettings: { dcVoltage: 48 },
});

assert.equal(result.ok, true);
assert.equal(result.form.projectInfo.projectTitle, "Test Project");
assert.ok(result.meta.durationMs >= 0);
console.log("runEngineeringDesign.test passed");
