import Dexie from "dexie";

export const shilDB =
  new Dexie("SHIL_V15_DB");

shilDB.version(1).stores({

  projects:
    "++id,name,updatedAt",

  drafts:
    "++id,type",

  cache:
    "++id,key",

});
