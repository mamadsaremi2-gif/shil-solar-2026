import { create } from "zustand";

export const useTelemetryStore = create((set) => ({
  connected: false,
  inverter: {
    pvPower: 0,
    batterySoc: 0,
    loadPower: 0,
    gridStatus: "UNKNOWN",
    temperature: 0,
  },
  lastPacketAt: null,

  setConnected: (connected) =>
    set({
      connected,
    }),

  updateTelemetry: (payload) =>
    set((state) => ({
      inverter: {
        ...state.inverter,
        ...payload,
      },
      lastPacketAt: new Date().toISOString(),
    })),
}));
