import { create } from "zustand";

export const useProjectStore = create((set) => ({
  projectInfo: {
    projectName: "",
    clientName: "",
    city: "",
    phone: "",
    projectType: "",
    description: "",
  },

  environment: {
    gps: "",
    latitude: "",
    longitude: "",
    azimuth: "",
    tilt: "",
    shadow: "",
    sunHours: 5,
  },

  calculation: {
    dailyUsage: "",
    inverterPower: "",
    batteryVoltage: 48,
    loadPower: "",
    backupHours: 2,
  },

  system: {
    panelModel: "",
    panelPower: 585,
    inverterModel: "",
    batteryModel: "",
    dod: 0.8,
  },

  results: null,

  setProjectInfo: (data) =>
    set((state) => ({
      projectInfo: { ...state.projectInfo, ...data },
    })),

  setEnvironment: (data) =>
    set((state) => ({
      environment: { ...state.environment, ...data },
    })),

  setCalculation: (data) =>
    set((state) => ({
      calculation: { ...state.calculation, ...data },
    })),

  setSystem: (data) =>
    set((state) => ({
      system: { ...state.system, ...data },
    })),

  setResults: (data) =>
    set(() => ({
      results: data,
    })),

  resetProject: () =>
    set(() => ({
      projectInfo: {
        projectName: "",
        clientName: "",
        city: "",
        phone: "",
        projectType: "",
        description: "",
      },
      environment: {
        gps: "",
        latitude: "",
        longitude: "",
        azimuth: "",
        tilt: "",
        shadow: "",
        sunHours: 5,
      },
      calculation: {
        dailyUsage: "",
        inverterPower: "",
        batteryVoltage: 48,
        loadPower: "",
        backupHours: 2,
      },
      system: {
        panelModel: "",
        panelPower: 585,
        inverterModel: "",
        batteryModel: "",
        dod: 0.8,
      },
      results: null,
    })),
}));
