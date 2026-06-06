/**
 * SHIL Sync Layer
 * Offline-first safe synchronization core.
 * Does not require backend yet.
 */

const SYNC_QUEUE_KEY = "shil_sync_queue_v1";
const SYNC_STATE_KEY = "shil_sync_state_v1";

const now = () => new Date().toISOString();

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSyncState() {
  return readJSON(SYNC_STATE_KEY, {
    status: navigator.onLine ? "online" : "offline",
    lastSyncAt: null,
    pendingCount: 0,
    lastError: null,
  });
}

export function setSyncState(partial) {
  const current = getSyncState();
  const next = { ...current, ...partial };
  writeJSON(SYNC_STATE_KEY, next);
  window.dispatchEvent(new CustomEvent("shil:sync-state", { detail: next }));
  return next;
}

export function getSyncQueue() {
  return readJSON(SYNC_QUEUE_KEY, []);
}

export function enqueueSyncJob(job) {
  const queue = getSyncQueue();

  const item = {
    id: crypto.randomUUID(),
    type: job.type || "unknown",
    entity: job.entity || "unknown",
    entityId: job.entityId || null,
    payload: job.payload || {},
    createdAt: now(),
    updatedAt: now(),
    retries: 0,
    status: "pending",
  };

  queue.push(item);
  writeJSON(SYNC_QUEUE_KEY, queue);

  setSyncState({
    pendingCount: queue.filter((x) => x.status === "pending").length,
    lastError: null,
  });

  return item;
}

export function removeSyncJob(id) {
  const queue = getSyncQueue().filter((x) => x.id !== id);
  writeJSON(SYNC_QUEUE_KEY, queue);
  setSyncState({
    pendingCount: queue.filter((x) => x.status === "pending").length,
  });
}

export function clearSyncQueue() {
  writeJSON(SYNC_QUEUE_KEY, []);
  setSyncState({ pendingCount: 0, lastError: null });
}

export async function flushSyncQueue(adapter) {
  const queue = getSyncQueue();

  if (!navigator.onLine) {
    setSyncState({ status: "offline" });
    return { ok: false, reason: "offline" };
  }

  if (!adapter || typeof adapter.push !== "function") {
    setSyncState({
      status: "online",
      pendingCount: queue.length,
      lastError: "No sync adapter configured",
    });
    return { ok: false, reason: "missing_adapter" };
  }

  const remaining = [];

  for (const job of queue) {
    try {
      await adapter.push(job);
    } catch (error) {
      remaining.push({
        ...job,
        retries: job.retries + 1,
        updatedAt: now(),
        status: "pending",
        lastError: error?.message || "Sync failed",
      });
    }
  }

  writeJSON(SYNC_QUEUE_KEY, remaining);

  setSyncState({
    status: "online",
    lastSyncAt: now(),
    pendingCount: remaining.length,
    lastError: remaining.length ? "Some jobs failed to sync" : null,
  });

  return {
    ok: remaining.length === 0,
    pendingCount: remaining.length,
  };
}

export function initSyncLayer(adapter = null) {
  const updateOnlineState = () => {
    setSyncState({
      status: navigator.onLine ? "online" : "offline",
    });

    if (navigator.onLine && adapter) {
      flushSyncQueue(adapter);
    }
  };

  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);

  updateOnlineState();

  return {
    getState: getSyncState,
    getQueue: getSyncQueue,
    enqueue: enqueueSyncJob,
    flush: () => flushSyncQueue(adapter),
    clear: clearSyncQueue,
  };
}
