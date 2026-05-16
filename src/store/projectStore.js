import { create } from "zustand";

export const useProjectStore = create((set) => ({
  currentProject: null,
  selectedScenario: null,
  workflowStep: null,
  completedSteps: [],
  environment: {},
  equipment: [],
  calculations: {},
  assistantContext: {},

  setProject: (data) => set({ currentProject: data }),
  setScenario: (data) => set({ selectedScenario: data }),
  setWorkflowStep: (step) => set({ workflowStep: step }),
  completeStep: (step) =>
    set((state) => ({
      completedSteps: [...new Set([...state.completedSteps, step])]
    })),
  setEnvironment: (data) => set({ environment: data }),
  setEquipment: (data) => set({ equipment: data }),
  setCalculations: (data) => set({ calculations: data }),
  setAssistantContext: (data) => set({ assistantContext: data })
}));
