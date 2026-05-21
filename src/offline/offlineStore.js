import localforage from "localforage";

export const offlineStore =
  localforage.createInstance({
    name: "SHIL_OFFLINE_STORAGE",
  });
