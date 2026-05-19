export function validateEngineeringResult(result) {
  const checks = [];

  if (!result?.form) checks.push(createCheck("form", "missing", "error", "ÙØ±Ù… Ù…Ù‡Ù†Ø¯Ø³ÛŒ ÙˆØ¬ÙˆØ¯ Ù†Ø¯Ø§Ø±Ø¯."));
  if ((result?.errors || []).length > 0) checks.push(createCheck("pipeline", "engine-error", "error", "Ø­Ø¯Ø§Ù‚Ù„ ÛŒÚ© Engine Ø¨Ø§ Ø®Ø·Ø§ Ù…ÙˆØ§Ø¬Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª."));
  if (!result?.projectPath && !result?.form?.projectPath) checks.push(createCheck("projectPath", "missing", "warning", "Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ Ù…Ø´Ø®Øµ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª."));

  const errorCount = checks.filter((check) => check.level === "error").length;
  const warningCount = checks.filter((check) => check.level === "warning").length;
  const score = Math.max(0, 100 - errorCount * 50 - warningCount * 10);

  return {
    score,
    grade: errorCount ? "blocked" : warningCount ? "review" : "acceptable",
    checks,
  };
}

function createCheck(path, rule, level, message) {
  return { path, rule, level, message };
}
