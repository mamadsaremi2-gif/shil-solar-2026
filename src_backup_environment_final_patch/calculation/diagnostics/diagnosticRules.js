export function runDiagnostics(form = {}, result = {}) {
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const errors = Array.isArray(result.errors) ? result.errors : [];
  const recommendations = [
    ...errors.map((item) => item.message || item.fa || String(item)),
    ...warnings.map((item) => item.message || item.fa || String(item)),
  ].filter(Boolean);

  return {
    status: errors.length ? "needs-review" : "active",
    warnings,
    recommendations,
    form,
    result,
  };
}
