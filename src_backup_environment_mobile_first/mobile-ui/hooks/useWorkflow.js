import { workflowStore } from "../../store/workflowStore.js";

export function useWorkflow() {
  const state = workflowStore.getState();

  return {
    ...state,
    setStep: workflowStore.setStep,
    completeStep: workflowStore.completeStep,
    updateProject: (payload) => workflowStore.updateSection("project", payload),
    updatePV: (payload) => workflowStore.updateSection("pv", payload),
    updateBattery: (payload) => workflowStore.updateSection("battery", payload),
    updateInverter: (payload) => workflowStore.updateSection("inverter", payload),
    updateCable: (payload) => workflowStore.updateSection("cable", payload),
    updateEnvironment: (payload) => workflowStore.updateSection("environment", payload),
    subscribe: workflowStore.subscribe
  };
}
