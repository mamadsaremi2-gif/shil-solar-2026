import { createWorkflowStore } from "../../src/store/createWorkflowStore.js";
import { assert } from "../fixtures.js";

const store = createWorkflowStore();
store.updateSection("project", { title: "Workflow Test", dailyEnergyWh: 1000, peakLoadW: 500 });
store.setStep("environment");
store.completeStep("project-info");

const state = store.getState();

assert(state.currentStep === "environment", "Store should update current step.");
assert(state.form.project.title === "Workflow Test", "Store should update project section.");
assert(state.completedSteps.includes("project-info"), "Store should track completed steps.");
assert(state.dirty === true, "Store should mark dirty after update.");

console.log("workflowStore.test passed");
