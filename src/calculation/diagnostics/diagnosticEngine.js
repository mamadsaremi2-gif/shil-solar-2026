import { runDiagnostics } from "./diagnosticRules.js";

export function runDiagnosticEngine(form = {}, result = {}) {
  const diagnostics = runDiagnostics(form, result);
  return { ...result, diagnostics };
}
