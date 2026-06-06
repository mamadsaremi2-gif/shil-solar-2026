import localforage from "localforage";

export const shilOfflineStore = localforage.createInstance({
  name: "SHIL_V15",
  storeName: "offline_cache",
});

export async function cacheSet(key, value) {
  return shilOfflineStore.setItem(key, {
    value,
    updatedAt: new Date().toISOString(),
  });
}

export async function cacheGet(key) {
  const record = await shilOfflineStore.getItem(key);
  return record?.value ?? null;
}

export async function cacheRemove(key) {
  return shilOfflineStore.removeItem(key);
}
