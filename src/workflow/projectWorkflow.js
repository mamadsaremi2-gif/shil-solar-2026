import { upsertUserRecord } from "../auth/session.js";

export const PROJECT_STEP_ORDER = [
  { key: "info", route: "/new-project/info", title: "اطلاعات پروژه" },
  { key: "environment", route: "/new-project/environment", title: "شرایط محیطی" },
  { key: "path", route: "/new-project/path", title: "انتخاب مسیر پروژه" },
  { key: "method", route: "/new-project/method", title: "روش ورود دیتا" },
  { key: "inputs", route: "/new-project/inputs", title: "ورودی محاسبات" },
  { key: "system", route: "/new-project/system", title: "تنظیمات سیستم" },
  { key: "summary", route: "/new-project/summary", title: "چکیده اطلاعات" },
  { key: "run", route: "/new-project/run", title: "اجرای محاسبات" },
];

const STORAGE_KEY = "shil-project-workflow-v2";

export function readWorkflowState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeWorkflowState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent("shil-workflow-updated", { detail: nextState }));
}



function safeParseLocal(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; }
}

function saveRunningProjectSnapshot(stepKey) {
  const project = safeParseLocal("shil:projectInfoDraft", {});
  const selectedPath = safeParseLocal("shil:selectedProjectPath", {});
  const domain = localStorage.getItem("shil:calculationDomain") || selectedPath.calculationDomain || "solar";
  const title = project.projectName || project.name || (domain === "emergency" ? "پروژه برق اضطراری" : "پروژه خورشیدی");
  const resumeUrl = domain === "emergency" && stepKey === "path" ? "/new-project/summary/emergency" : (PROJECT_STEP_ORDER.find((step) => step.key === stepKey)?.route || "/new-project/info");
  const projectKey = localStorage.getItem("shil:activeProjectKey") || `draft-${Date.now()}`;
  localStorage.setItem("shil:activeProjectKey", projectKey);
  upsertUserRecord("shil-projects", (item) => item.projectKey === projectKey, {
    projectKey,
    title,
    status: "running",
    domain,
    currentStep: stepKey,
    resumeUrl: domain === "solar" && resumeUrl === "/new-project/system" ? "/new-project/system/solar" : resumeUrl,
    snapshot: { project, selectedPath, workflow: readWorkflowState() }
  });
}

export function approveProjectStep(stepKey) {
  const state = readWorkflowState();
  writeWorkflowState({ ...state, [stepKey]: { approved: true, approvedAt: new Date().toISOString() } });
  saveRunningProjectSnapshot(stepKey);
}

export function resetProjectWorkflow() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("shil-workflow-updated", { detail: {} }));
}

export function getStepKeyFromPath(pathname = "") {
  if (pathname.includes("/new-project/input/")) return "inputs";
  if (pathname.includes("/new-project/solar/") || pathname.includes("/new-project/emergency") || pathname.endsWith("/new-project/method")) return "method";
  if (pathname.includes("/new-project/system")) return "system";
  if (pathname.includes("/new-project/summary")) return "summary";
  if (pathname.includes("/new-project/run")) return "run";
  const match = PROJECT_STEP_ORDER.find((step) => pathname.startsWith(step.route));
  return match?.key || null;
}

export function canEditStep(stepKey, state = readWorkflowState()) {
  const index = PROJECT_STEP_ORDER.findIndex((step) => step.key === stepKey);
  if (index <= 0) return true;
  const previous = PROJECT_STEP_ORDER[index - 1];
  return Boolean(state[previous.key]?.approved);
}

export function getPreviousStep(stepKey) {
  const index = PROJECT_STEP_ORDER.findIndex((step) => step.key === stepKey);
  return index > 0 ? PROJECT_STEP_ORDER[index - 1] : null;
}
