import { create } from "zustand";

export const useProjectStore = create((set) => ({

  project: {

    title: "",
    customer: "",
    dailyEnergyWh: 12500,
    peakLoadW: 4800,
    backupHours: 8,
    panelPowerW: 585,
    batteryVoltage: 48,

  },

  setProjectField: (key, value) =>
    set((state) => ({

      project: {

        ...state.project,
        [key]: value,

      },

    })),

  setProject: (project) =>
    set({ project }),

}));
