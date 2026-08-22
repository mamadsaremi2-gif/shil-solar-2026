import { SHIL_WORKFLOW_STEPS, getWorkflowStep, getWorkflowStepIds } from "./workflowDefinition.js";
import { validateEngineeringForm } from "../validation/engineering/validationEngine.js";
import { runEngineeringDesign } from "../runEngineeringDesign.js";

export class WorkflowOrchestrator {
  constructor(store, options = {}) {
    this.store = store;
    this.options = options;
  }

  getState() {
    return this.store.getState();
  }

  getCurrentStep() {
    return getWorkflowStep(this.getState().currentStep);
  }

  getProgress() {
    const state = this.getState();
    const ids = getWorkflowStepIds();
    const currentIndex = ids.indexOf(state.currentStep);

    return {
      currentStep: state.currentStep,
      currentIndex,
      total: ids.length,
      completed: state.completedSteps,
      percent: Math.round((state.completedSteps.length / ids.length) * 100)
    };
  }

  isStepRequired(stepId) {
    const step = getWorkflowStep(stepId);
    if (!step) return false;
    if (step.required) return true;
    if (step.requiredFor) {
      return step.requiredFor.includes(this.getState().form.project.scenario);
    }
    return false;
  }

  canEnterStep(stepId) {
    const ids = getWorkflowStepIds();
    const targetIndex = ids.indexOf(stepId);
    if (targetIndex <= 0) return true;

    const previousRequired = ids
      .slice(0, targetIndex)
      .filter((id) => this.isStepRequired(id));

    return previousRequired.every((id) => this.getState().completedSteps.includes(id));
  }

  validateCurrent() {
    const validation = validateEngineeringForm(this.getState().form);
    this.store.setValidation(validation);
    return validation;
  }

  goTo(stepId) {
    if (!getWorkflowStep(stepId)) throw new Error(`Unknown workflow step: ${stepId}`);
    if (!this.canEnterStep(stepId) && this.options.strictNavigation) {
      const error = new Error(`Cannot enter locked workflow step: ${stepId}`);
      error.code = "WORKFLOW_STEP_LOCKED";
      throw error;
    }
    this.store.setStep(stepId);
    return this.getState();
  }

  next() {
    const current = this.getCurrentStep();
    if (!current) throw new Error("Current workflow step is invalid.");

    const candidate = current.next.find((stepId) => this.isStepRequired(stepId) || getWorkflowStep(stepId));
    if (!candidate) return this.getState();

    this.store.completeStep(current.id);
    this.store.setStep(candidate);
    return this.getState();
  }

  previous() {
    const ids = getWorkflowStepIds();
    const index = ids.indexOf(this.getState().currentStep);
    const previous = ids[Math.max(index - 1, 0)];
    this.store.setStep(previous);
    return this.getState();
  }

  runCalculation(options = {}) {
    const result = runEngineeringDesign(this.getState().form, options);
    this.store.setEngineResult(result);
    this.store.completeStep("run-calculation");
    return result;
  }

  getStepMap() {
    return SHIL_WORKFLOW_STEPS.map((step) => ({
      ...step,
      requiredNow: this.isStepRequired(step.id),
      completed: this.getState().completedSteps.includes(step.id),
      locked: !this.canEnterStep(step.id)
    }));
  }
}
