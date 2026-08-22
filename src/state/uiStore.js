import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useUIStore = create(
  immer((set) => ({

    sidebarOpen: false,

    themeMode: "dark",

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen =
          !state.sidebarOpen;
      }),

    setThemeMode: (mode) =>
      set((state) => {
        state.themeMode = mode;
      }),

  }))
);
