import { create } from "zustand";

export const useProjectStore = create((set) => ({

  projectInfo: {
    projectName: "",
    clientName: "",
    city: "",
    description: "",
  },

  environment: {
    gps: "",
    azimuth: "",
    tilt: "",
    shadow: "",
  },

  calculation: {
    dailyUsage: "",
    inverterPower: "",
    batteryVoltage: "",
  },

  system: {
    panelModel: "",
    inverterModel: "",
    batteryModel: "",
  },

  setProjectInfo: (data) =>
    set((state) => ({
      projectInfo: {
        ...state.projectInfo,
        ...data,
      },
    })),

  setEnvironment: (data) =>
    set((state) => ({
      environment: {
        ...state.environment,
        ...data,
      },
    })),

  setCalculation: (data) =>
    set((state) => ({
      calculation: {
        ...state.calculation,
        ...data,
      },
    })),

  setSystem: (data) =>
    set((state) => ({
      system: {
        ...state.system,
        ...data,
      },
    })),

}));
