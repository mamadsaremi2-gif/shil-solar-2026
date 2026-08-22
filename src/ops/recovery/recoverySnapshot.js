export function createRecoverySnapshot(data = {}) {
  const snapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    app: "SHIL_V15",
    data,
  };

  localStorage.setItem(
    "shil-recovery-snapshot",
    JSON.stringify(snapshot)
  );

  return snapshot;
}

export function loadRecoverySnapshot() {
  return JSON.parse(
    localStorage.getItem("shil-recovery-snapshot") || "null"
  );
}
