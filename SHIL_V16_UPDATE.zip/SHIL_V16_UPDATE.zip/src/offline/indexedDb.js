import { openDB } from "idb";

export async function initOfflineDB() {

  return openDB("SHIL_OFFLINE_DB", 1, {

    upgrade(db) {

      if (
        !db.objectStoreNames.contains(
          "projects"
        )
      ) {

        db.createObjectStore(
          "projects",
          {
            keyPath: "id",
            autoIncrement: true,
          }
        );

      }

    },

  });
}
