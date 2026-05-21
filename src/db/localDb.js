const DB_NAME = "shil_local_db_v1";
const DB_VERSION = 1;

const STORES = [
  "projects",
  "drafts",
  "project_steps",
  "equipment_cache",
  "climate_cache",
  "sync_jobs"
];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txStore(db, storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function putLocal(storeName, value) {
  const db = await openDB();

  const item = {
    ...value,
    id: value.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = txStore(db, storeName, "readwrite").put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocal(storeName, id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const request = txStore(db, storeName).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listLocal(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const request = txStore(db, storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeLocal(storeName, id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const request = txStore(db, storeName, "readwrite").delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
