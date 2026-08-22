import { workflowStore } from "../../store/workflowStore.js";
import { validateEngineeringForm } from "../../validation/engineering/validationEngine.js";

export const STEP_ORDER = [
  "project-info",
  "environment",
  "project-path",
  "pv-array",
  "battery",
  "inverter",
  "cable",
  "run-calculation"
];

export const STEP_SECTION_MAP = {
  "project-info": "project",
  "environment": "environment",
  "project-path": "project",
  "pv-array": "pv",
  "battery": "battery",
  "inverter": "inverter",
  "cable": "cable"
};

export function bindStep(stepId) {
  const section = STEP_SECTION_MAP[stepId];

  return {
    getValue() {
      const state = workflowStore.getState();
      return section ? state.form[section] : state.form;
    },

    update(payload) {
      if (!section) return workflowStore.setState({ form: payload });
      return workflowStore.updateSection(section, payload);
    },

    validate() {
      const state = workflowStore.getState();
      const validation = validateEngineeringForm(state.form);
      workflowStore.setValidation(validation);
      return validation;
    },

    next() {
      const currentIndex = STEP_ORDER.indexOf(stepId);
      const nextStep = STEP_ORDER[Math.min(currentIndex + 1, STEP_ORDER.length - 1)];
      workflowStore.completeStep(stepId);
      workflowStore.setStep(nextStep);
      return nextStep;
    },

    previous() {
      const currentIndex = STEP_ORDER.indexOf(stepId);
      const previousStep = STEP_ORDER[Math.max(currentIndex - 1, 0)];
      workflowStore.setStep(previousStep);
      return previousStep;
    }
  };
}
