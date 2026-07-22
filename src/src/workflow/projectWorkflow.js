import { upsertUserRecord } from "../auth/session.js";

export const PROJECT_PATHS = Object.freeze({
  SOLAR: "solar",
  EMERGENCY: "emergency",
  UTILITY: "utility",
});

export const PROJECT_STEP_ORDER = [
  { key: "path", route: "/new-project/path", title: "مسیر پروژه" },
  { key: "info", route: "/new-project/info", title: "اطلاعات پروژه" },
  { key: "environment", route: "/new-project/environment", title: "شرایط محیطی", optionalFor: [PROJECT_PATHS.EMERGENCY] },
  { key: "method", route: "/new-project/method", title: "روش ورود دیتا" },
  { key: "inputs", route: "/new-project/inputs", title: "ورودی محاسبات" },
  { key: "system", route: "/new-project/system", title: "تنظیمات" },
  { key: "summary", route: "/new-project/summary", title: "چکیده طراحی" },
  { key: "run", route: "/new-project/run", title: "اجرا" },
];

const STORAGE_KEY = "shil-project-workflow-v3";
const LEGACY_STORAGE_KEY = "shil-project-workflow-v2";

function safeJson(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; }
}

function readProjectPathDomain() {
  const path = safeJson("shil:projectPath", null) || safeJson("shil:selectedProjectPath", null);
  if (typeof path === "string") return path;
  return path?.domain || path?.type || localStorage.getItem("shil:calculationDomain") || PROJECT_PATHS.SOLAR;
}

function systemRouteForDomain(domain = readProjectPathDomain()) {
  if (domain === PROJECT_PATHS.EMERGENCY) return "/new-project/system/emergency";
  if (domain === PROJECT_PATHS.UTILITY) return "/new-project/system/utility";
  return "/new-project/system/solar";
}

function summaryRouteForDomain(domain = readProjectPathDomain()) {
  return `/new-project/summary/${domain || PROJECT_PATHS.SOLAR}`;
}

function runRouteForDomain(domain = readProjectPathDomain()) {
  return `/new-project/run/${domain || PROJECT_PATHS.SOLAR}`;
}

export function readWorkflowState() {
  const state = safeJson(STORAGE_KEY, null);
  if (state) return state;
  return safeJson(LEGACY_STORAGE_KEY, {});
}

export function writeWorkflowState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent("shil-workflow-updated", { detail: nextState }));
}

function saveRunningProjectSnapshot(stepKey) {
  const project = safeJson("shil:projectInfoDraft", {});
  const selectedPath = safeJson("shil:selectedProjectPath", {}) || safeJson("shil:projectPath", {});
  const domain = readProjectPathDomain();
  const title = project.projectName || project.name || (
    domain === PROJECT_PATHS.EMERGENCY ? "پروژه برق اضطراری" :
    domain === PROJECT_PATHS.UTILITY ? "پروژه نیروگاه خورشیدی" :
    "پروژه پنل خورشیدی"
  );
  const baseRoute = PROJECT_STEP_ORDER.find((step) => step.key === stepKey)?.route || "/new-project/path";
  const resumeUrl = stepKey === "system" ? systemRouteForDomain(domain) : stepKey === "summary" ? summaryRouteForDomain(domain) : stepKey === "run" ? runRouteForDomain(domain) : baseRoute;
  const projectKey = localStorage.getItem("shil:activeProjectKey") || `draft-${Date.now()}`;
  localStorage.setItem("shil:activeProjectKey", projectKey);
  upsertUserRecord("shil-projects", (item) => item.projectKey === projectKey, {
    projectKey,
    title,
    status: "running",
    domain,
    projectPath: selectedPath,
    currentStep: stepKey,
    resumeUrl,
    snapshot: {
      project,
      selectedPath,
      handoff: safeJson("shil:systemSetupHandoff", null),
      systemSettings: safeJson("shil:systemSettingsDraft", null),
      workflow: readWorkflowState(),
    },
  });
}

export function approveProjectStep(stepKey) {
  const state = readWorkflowState();
  writeWorkflowState({ ...state, [stepKey]: { approved: true, approvedAt: new Date().toISOString() } });
  saveRunningProjectSnapshot(stepKey);
}

export function resetProjectWorkflow() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("shil-workflow-updated", { detail: {} }));
}

export function getStepKeyFromPath(pathname = "") {
  if (pathname.includes("/new-project/path") || pathname === "/new-project") return "path";
  if (pathname.includes("/new-project/info")) return "info";
  if (pathname.includes("/new-project/environment")) return "environment";
  if (pathname.includes("/new-project/solar/") || pathname.includes("/new-project/emergency") || pathname.endsWith("/new-project/method")) return "method";
  if (pathname.includes("/new-project/input/") || pathname.includes("/new-project/inputs")) return "inputs";
  if (pathname.includes("/new-project/system")) return "system";
  if (pathname.includes("/new-project/summary")) return "summary";
  if (pathname.includes("/new-project/run")) return "run";
  const match = PROJECT_STEP_ORDER.find((step) => pathname.startsWith(step.route));
  return match?.key || null;
}

export function canEditStep(stepKey, state = readWorkflowState(), domain = readProjectPathDomain()) {
  const index = PROJECT_STEP_ORDER.findIndex((step) => step.key === stepKey);
  if (index <= 0) return true;
  for (let i = index - 1; i >= 0; i -= 1) {
    const previous = PROJECT_STEP_ORDER[i];
    if (previous.optionalFor?.includes(domain)) continue;
    return Boolean(state[previous.key]?.approved);
  }
  return true;
}

export function getPreviousStep(stepKey, domain = readProjectPathDomain()) {
  const index = PROJECT_STEP_ORDER.findIndex((step) => step.key === stepKey);
  for (let i = index - 1; i >= 0; i -= 1) {
    const step = PROJECT_STEP_ORDER[i];
    if (!step.optionalFor?.includes(domain)) return step;
  }
  return null;
}

export function getSystemRouteForCurrentDomain() {
  return systemRouteForDomain();
}
