import localforage from "localforage";

export const SHIL_OFFLINE_VERSION = "shil-offline-v1.0.0";

const projectStore = localforage.createInstance({
  name: "SHIL_OFFLINE_ENGINEERING",
  storeName: "projects",
});

const imageStore = localforage.createInstance({
  name: "SHIL_OFFLINE_ENGINEERING",
  storeName: "images",
});

const queueStore = localforage.createInstance({
  name: "SHIL_OFFLINE_ENGINEERING",
  storeName: "sync_queue",
});

const settingsStore = localforage.createInstance({
  name: "SHIL_OFFLINE_ENGINEERING",
  storeName: "settings",
});

export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function saveOfflineProject(project) {
  const id = project?.id || project?.projectId || `offline-${Date.now()}`;
  const payload = {
    ...project,
    id,
    offline: true,
    updatedAt: new Date().toISOString(),
  };
  await projectStore.setItem(id, payload);
  return payload;
}

export async function getOfflineProject(id) {
  return projectStore.getItem(id);
}

export async function listOfflineProjects() {
  const projects = [];
  await projectStore.iterate((value) => projects.push(value));
  return projects.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export async function removeOfflineProject(id) {
  return projectStore.removeItem(id);
}

export async function saveOfflineImage(key, fileOrDataUrl) {
  let value = fileOrDataUrl;
  if (typeof File !== "undefined" && fileOrDataUrl instanceof File) {
    value = await fileToDataUrl(fileOrDataUrl);
  }
  const payload = {
    key,
    value,
    updatedAt: new Date().toISOString(),
  };
  await imageStore.setItem(key, payload);
  return payload;
}

export async function getOfflineImage(key) {
  const record = await imageStore.getItem(key);
  return record?.value || null;
}

export async function addOfflineQueueItem(action, payload) {
  const id = `queue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const record = {
    id,
    action,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  await queueStore.setItem(id, record);
  return record;
}

export async function listOfflineQueue() {
  const items = [];
  await queueStore.iterate((value) => items.push(value));
  return items.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

export async function saveOfflineSetting(key, value) {
  return settingsStore.setItem(key, { value, updatedAt: new Date().toISOString() });
}

export async function getOfflineSetting(key, fallback = null) {
  const record = await settingsStore.getItem(key);
  return record?.value ?? fallback;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function warmCriticalCaches() {
  if (!("caches" in window)) return false;
  const cache = await caches.open("shil-critical-offline-v1");
  const urls = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
    "/favicon.ico",
  ];
  await cache.addAll(urls.map((url) => new Request(url, { cache: "reload" })).filter(Boolean));
  return true;
}

export function exposeOfflineApi() {
  if (typeof window === "undefined") return;
  window.SHIL_OFFLINE = {
    version: SHIL_OFFLINE_VERSION,
    isOnline,
    saveProject: saveOfflineProject,
    getProject: getOfflineProject,
    listProjects: listOfflineProjects,
    removeProject: removeOfflineProject,
    saveImage: saveOfflineImage,
    getImage: getOfflineImage,
    addQueueItem: addOfflineQueueItem,
    listQueue: listOfflineQueue,
    saveSetting: saveOfflineSetting,
    getSetting: getOfflineSetting,
    warmCriticalCaches,
  };
}

export function bindOfflineLifecycle() {
  if (typeof window === "undefined") return;
  const updateStatus = () => {
    document.documentElement.dataset.shilOnline = String(isOnline());
    window.dispatchEvent(new CustomEvent("shil:connectivity", { detail: { online: isOnline() } }));
  };
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();
}

export async function initFullOfflineMode() {
  exposeOfflineApi();
  bindOfflineLifecycle();
  try {
    await warmCriticalCaches();
  } catch (error) {
    console.warn("SHIL offline cache warmup skipped:", error);
  }
}
