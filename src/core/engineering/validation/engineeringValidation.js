export function validateEngineeringResult(result) {
  const checks = [];

  if (!result?.form) checks.push(createCheck("form", "missing", "error", "فرم مهندسی وجود ندارد."));
  if ((result?.errors || []).length > 0) checks.push(createCheck("pipeline", "engine-error", "error", "حداقل یک Engine با خطا مواجه شده است."));
  if (!result?.projectPath && !result?.form?.projectPath) checks.push(createCheck("projectPath", "missing", "warning", "مسیر پروژه مشخص نشده است."));

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
