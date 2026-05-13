import { runDiagnostics } from "./diagnosticRules.js";

export function attachDiagnostics(form, result) {
  const diagnostics = runDiagnostics(form, result);
  return {
    ...result,
    diagnostics,
    health: {
      score: Math.max(0, 100 - diagnostics.filter((d) => d.severity === "error").length * 25 - diagnostics.filter((d) => d.severity === "warning").length * 10),
      errors: diagnostics.filter((d) => d.severity === "error").length,
      warnings: diagnostics.filter((d) => d.severity === "warning").length
    }
  };
}
