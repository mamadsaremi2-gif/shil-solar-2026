import { listFormSteps, getFormStep } from "../../src/forms/formRegistry.js";
import { readStepValues, writeStepValues, validateFieldLevel } from "../../src/forms/formAdapter.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const steps = listFormSteps();
assert(steps.length >= 6, "Form registry should expose major app steps.");

const projectStep = getFormStep("project-info");
assert(projectStep.section === "project", "Project step should map to project section.");

const form = createValidOffgridFixture();
const values = readStepValues(form, "project-info");
assert(values.title === "Test Offgrid Project", "Form adapter should read step values.");

const next = writeStepValues(form, "project-info", { title: "Updated Title" });
assert(next.project.title === "Updated Title", "Form adapter should write step values.");

const fieldValidation = validateFieldLevel({ title: "", scenario: "invalid" }, projectStep.fields);
assert(fieldValidation.valid === false, "Field-level validation should catch invalid values.");

console.log("formRegistry.test passed");
