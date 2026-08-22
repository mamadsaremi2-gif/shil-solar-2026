const KEY = "shil:admin:diagnostics";
const LIMIT = 240;

function safeParse(value, fallback = []) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function normalizeError(error) {
  if (!error) return { message: "Unknown error", stack: "" };
  if (typeof error === "string") return { message: error, stack: "" };
  return {
    message: String(error.message || error.reason || error),
    stack: String(error.stack || ""),
  };
}

export function readAdminDiagnostics() {
  if (typeof window === "undefined") return [];
  const list = safeParse(window.localStorage.getItem(KEY), []);
  return Array.isArray(list) ? list : [];
}

export function captureAdminDiagnostic({ type = "runtime", severity = "error", source = "app", error, message, context = {}, projectId = "", userId = "" } = {}) {
  if (typeof window === "undefined") return null;
  const normalized = normalizeError(error || message);
  const item = {
    id: `diag-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    severity,
    source,
    message: String(message || normalized.message || "Unknown diagnostic"),
    stack: normalized.stack,
    context: context && typeof context === "object" ? context : { value: String(context || "") },
    projectId: String(projectId || context?.projectId || ""),
    userId: String(userId || context?.userId || ""),
    route: typeof location !== "undefined" ? String(location.pathname || "") : "",
    userAgent: typeof navigator !== "undefined" ? String(navigator.userAgent || "") : "",
    createdAt: new Date().toISOString(),
    status: "open",
    resolvedAt: "",
    resolutionNote: "",
  };
  const next = [item, ...readAdminDiagnostics()].slice(0, LIMIT);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function updateAdminDiagnostic(id, patch = {}) {
  if (typeof window === "undefined") return [];
  const next = readAdminDiagnostics().map((item) => item.id === id ? { ...item, ...patch } : item);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resolveAdminDiagnostic(id, note = "") {
  return updateAdminDiagnostic(id, { status: "resolved", resolvedAt: new Date().toISOString(), resolutionNote: String(note || "") });
}

export function reopenAdminDiagnostic(id) {
  return updateAdminDiagnostic(id, { status: "open", resolvedAt: "", resolutionNote: "" });
}

export function clearResolvedAdminDiagnostics() {
  if (typeof window === "undefined") return [];
  const next = readAdminDiagnostics().filter((item) => item.status !== "resolved");
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearAllAdminDiagnostics() {
  if (typeof window === "undefined") return [];
  window.localStorage.setItem(KEY, JSON.stringify([]));
  return [];
}

export function exportDiagnosticsBundle(extra = {}) {
  return {
    format: "SHIL_ADMIN_DIAGNOSTICS_V1",
    exportedAt: new Date().toISOString(),
    diagnostics: readAdminDiagnostics(),
    lastRuntimeError: safeParse(typeof localStorage !== "undefined" ? localStorage.getItem("shil:lastRuntimeError") : "", null),
    ...extra,
  };
}
