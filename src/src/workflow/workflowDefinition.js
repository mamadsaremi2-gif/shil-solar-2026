export const PROJECT_PATHS = Object.freeze({
  SOLAR: "solar",
  EMERGENCY: "emergency",
  UTILITY: "utility",
});

export const SHIL_WORKFLOW_STEPS = [
  { id: "project-path", key: "path", title: "مسیر پروژه", section: "project", required: true, next: ["project-info"] },
  { id: "project-info", key: "info", title: "اطلاعات پروژه", section: "project", required: true, next: ["environment", "calculation-method"] },
  { id: "environment", key: "environment", title: "شرایط محیطی", section: "environment", required: true, optionalFor: [PROJECT_PATHS.EMERGENCY], next: ["calculation-method"] },
  { id: "calculation-method", key: "method", title: "روش ورود دیتا", section: "calculation", required: true, next: ["calculation-inputs"] },
  { id: "calculation-inputs", key: "inputs", title: "ورودی محاسبات", section: "calculation", required: true, next: ["system-settings"] },
  { id: "system-settings", key: "system", title: "تنظیمات", section: "system", required: true, next: ["summary"] },
  { id: "summary", key: "summary", title: "چکیده طراحی", section: "summary", required: true, next: ["run-calculation"] },
  { id: "run-calculation", key: "run", title: "اجرا", section: "result", required: true, next: [] },
];

export const METHOD_BY_PROJECT_PATH = Object.freeze({
  [PROJECT_PATHS.SOLAR]: ["power", "current", "solar_panel_power", "equipment", "profile", "energy"],
  [PROJECT_PATHS.EMERGENCY]: ["current", "power", "equipment"],
  [PROJECT_PATHS.UTILITY]: ["utility_scale"],
});

export function getWorkflowStep(id) {
  return SHIL_WORKFLOW_STEPS.find((step) => step.id === id || step.key === id) || null;
}

export function getWorkflowStepIds() {
  return SHIL_WORKFLOW_STEPS.map((step) => step.id);
}

export function getWorkflowStepsForPath(projectPath = PROJECT_PATHS.SOLAR) {
  return SHIL_WORKFLOW_STEPS.filter((step) => !step.optionalFor?.includes(projectPath));
}

export function getAllowedMethodsForPath(projectPath = PROJECT_PATHS.SOLAR) {
  return METHOD_BY_PROJECT_PATH[projectPath] || METHOD_BY_PROJECT_PATH[PROJECT_PATHS.SOLAR];
}
