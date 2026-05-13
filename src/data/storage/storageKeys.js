export const STORAGE_KEYS = Object.freeze({
  PROJECT_PREFIX: "project:",
  SNAPSHOT_PREFIX: "snapshot:",
  SYNC_QUEUE: "sync:queue",
  MIGRATION_VERSION: "migration:version",
  ERROR_LOG_PREFIX: "error:"
});

export function projectKey(id) {
  return `${STORAGE_KEYS.PROJECT_PREFIX}${id}`;
}

export function snapshotKey(id) {
  return `${STORAGE_KEYS.SNAPSHOT_PREFIX}${id}`;
}

export function errorLogKey(id) {
  return `${STORAGE_KEYS.ERROR_LOG_PREFIX}${id}`;
}
