export function runDiagnostics(form = {}, result = {}) {
  return { status: "disabled", warnings: [], recommendations: [], form, result };
}
