import { createWorkflowStore } from "../../src/store/createWorkflowStore.js";
import { WorkflowOrchestrator } from "../../src/workflow/WorkflowOrchestrator.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const store = createWorkflowStore({ form: createValidOffgridFixture() });
const orchestrator = new WorkflowOrchestrator(store);

assert(orchestrator.getCurrentStep().id === "project-info", "Workflow should start at project-info.");
assert(orchestrator.getProgress().total >= 8, "Workflow should expose total steps.");

orchestrator.next();
assert(store.getState().currentStep === "environment", "Workflow next should move to environment.");

const map = orchestrator.getStepMap();
assert(map.some((step) => step.id === "battery" && step.requiredNow === true), "Battery should be required for offgrid.");

const result = orchestrator.runCalculation({ stopOnValidationError: false });
assert(result.outputs.pv.arrayPowerW === 4400, "Workflow should run calculation.");

console.log("workflowOrchestrator.test passed");
