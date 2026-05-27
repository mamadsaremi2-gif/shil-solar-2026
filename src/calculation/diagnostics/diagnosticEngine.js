export function attachDiagnostics(form = {}, result = {}) {
  return { ...result, diagnostics: { status: "disabled", warnings: [], recommendations: [] } };
}
