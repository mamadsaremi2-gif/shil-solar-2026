import localforage
from "localforage";

export const offlineStore =
  localforage.createInstance({

    name: "SHIL_OFFLINE",

    storeName:
      "engineering_cache",

  });
