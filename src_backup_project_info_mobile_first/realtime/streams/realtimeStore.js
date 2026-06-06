import { create } from "zustand";

export const useRealtimeStore = create((set) => ({

  connected: false,

  lastUpdate: null,

  pvPower: 0,

  batterySOC: 0,

  loadPower: 0,

  grid: "OFFLINE",

  setRealtimeData: (payload) =>

    set({

      ...payload,

      lastUpdate: Date.now(),

    }),

  setConnected: (value) =>

    set({

      connected: value,

    }),

}));
