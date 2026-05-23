import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useDataLayerStore = create(
  immer((set) => ({
    online: navigator.onLine,
    syncStatus: "idle",
    lastSyncAt: null,
    pendingJobs: 0,

    setOnline: (value) =>
      set((state) => {
        state.online = value;
      }),

    setSyncStatus: (status) =>
      set((state) => {
        state.syncStatus = status;
      }),

    setLastSyncAt: (date) =>
      set((state) => {
        state.lastSyncAt = date;
      }),

    setPendingJobs: (count) =>
      set((state) => {
        state.pendingJobs = count;
      }),
  }))
);
