import { captureAdminDiagnostic } from "../../admin/adminDiagnostics.js";

let registered = false;

export function registerGlobalErrorHandlers() {
  if (registered || typeof window === "undefined") return;
  registered = true;

  window.addEventListener("error", (event) => {
    console.error("[SHIL Global Error]", event.error);
    captureAdminDiagnostic({
      type: "runtime",
      severity: "error",
      source: "window.error",
      error: event.error || event.message,
      context: { filename: event.filename || "", line: event.lineno || 0, column: event.colno || 0 },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[SHIL Promise Error]", event.reason);
    captureAdminDiagnostic({
      type: "promise",
      severity: "error",
      source: "unhandledrejection",
      error: event.reason,
    });
  });
}
