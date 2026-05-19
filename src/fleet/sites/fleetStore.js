import { create } from "zustand";

export const useFleetStore = create((set) => ({

  sites: [

    {
      id: "site-1",
      title: "Solar Farm A",
      city: "Tehran",
      power: 124500,
      status: "ONLINE",
      alarms: 0,
      energyToday: 582,
    },

    {
      id: "site-2",
      title: "Hybrid Plant B",
      city: "Shiraz",
      power: 88400,
      status: "WARNING",
      alarms: 2,
      energyToday: 431,
    },

  ],

  setSites: (sites) =>
    set({ sites }),

}));
