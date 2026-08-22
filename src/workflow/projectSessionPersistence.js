import { readUserRecords } from "../auth/session.js";

const ACTIVE_KEY = "shil:activeProjectKey";
const PROJECTS_KEY = "shil-projects";
const SESSION_MODE_KEY = "shil:projectSessionMode";
const NEW_SESSION_VALUE = "new";
const RESUME_SESSION_VALUE = "resume";

const EXACT_PROJECT_KEYS = new Set([
  "shil-project-workflow-v3",
  "shil-project-workflow-v2",
  "shil:projectPath",
  "shil:selectedProjectPath",
  "shil:calculationDomain",
  "shil:scenarioDomain",
  "shil:projectEngine",
  "shil:projectScale",
  "shil:projectCreationMode",
  "shil:executionMethod",
  "shil:calculationMethod",
  "shil:selectedCalculationMethod",
  "shil:projectInfoDraft",
  "shil:environmentDraft",
  "shil:environmentAssessment",
  "shil:environmentSiteImages",
  "shil:environmentSiteImageCount",
  "shil:environmentCompassPreview",
  "shil:environmentCompassSaved",
  "shil:calculationInputsDraft",
  "shil:systemSettingsDraft",
  "shil:systemSettingsDraft:live",
  "shil:summaryDraft",
  "shil:systemSetupHandoff",
  "shil:selectedEquipmentItems",
  "shil:equipmentCalculationStats",
  "shil:equipmentDraft",
  "shil:loadCalculationDraft",
  "shil:loadEngineResult",
  "shil:engineeringFormDraft",
  "shil:calculationInput",
  "shil:solarSystemDesign",
  "shil:solarSystemDesign:live",
  "shil:emergencySystemDesign",
  "shil:emergencySystemDesign:live",
  "shil:utilitySystemDesign",
  "shil:utilitySystemDesign:live",
  "shil:solarPanelPowerInput",
  "shil:solarPanelPowerPreview",
  "shil:unifiedPvEngineResult",
  "shil:unifiedPvEngineResult:input",
  "shil:profileConsumptionInput",
  "shil:finalEngineeringOutput",
  "shil:aiInstallationPreview",
  "shil:emergencyPowerSettings",
  "shil:solarSystemType",
  "shil:scenarioFlowActive",
  "shil:selectedScenario",
  "shil:scenarioNextStep",
  "shil:scenarioEquipmentBranch",
  "shil:scenarioEquipmentConfirmed",
  "shil:scenarioLevel",
  "shil:utilityGatewayActive",
  "shil:utilityRedirectReason",
]);

const PROJECT_KEY_PREFIXES = [
  "shil:environmentDraft:",
  "shil:systemSetupHandoff:",
  "shil:engineering-page-draft:",
  "shil:project-page-confirmed:",
];

function isProjectDataKey(key = "") {
  return EXACT_PROJECT_KEYS.has(key) || PROJECT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function makeProjectKey() {
  if (globalThis.crypto?.randomUUID) return `project-${crypto.randomUUID()}`;
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getActiveProjectKey() {
  return localStorage.getItem(ACTIVE_KEY) || "";
}

export function ensureActiveProjectKey() {
  const current = getActiveProjectKey();
  if (current) return current;
  const key = makeProjectKey();
  localStorage.setItem(ACTIVE_KEY, key);
  return key;
}

export function captureProjectLocalState() {
  const values = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !isProjectDataKey(key)) continue;
    values[key] = localStorage.getItem(key);
  }
  return { version: 2, capturedAt: new Date().toISOString(), values };
}

export function clearActiveProjectData({ keepActiveKey = false } = {}) {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isProjectDataKey(key)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
  if (!keepActiveKey) localStorage.removeItem(ACTIVE_KEY);
}

export function beginNewProjectSession() {
  clearActiveProjectData();
  const projectKey = makeProjectKey();
  localStorage.setItem(ACTIVE_KEY, projectKey);
  localStorage.setItem(SESSION_MODE_KEY, NEW_SESSION_VALUE);
  window.dispatchEvent(new CustomEvent("shil-project-session-started", { detail: { projectKey, mode: NEW_SESSION_VALUE } }));
  return projectKey;
}

export function restoreProjectLocalState(project) {
  if (!project?.projectKey) return null;
  clearActiveProjectData();
  localStorage.setItem(ACTIVE_KEY, project.projectKey);
  localStorage.setItem(SESSION_MODE_KEY, RESUME_SESSION_VALUE);

  const values = project.snapshot?.localState?.values || project.localState?.values || {};
  Object.entries(values).forEach(([key, value]) => {
    if (isProjectDataKey(key) && value !== null && value !== undefined) {
      localStorage.setItem(key, String(value));
    }
  });

  window.dispatchEvent(new CustomEvent("shil-project-session-restored", {
    detail: { projectKey: project.projectKey, status: project.status, resumeUrl: project.resumeUrl },
  }));
  return project;
}

export function activateManagedProject(projectKey) {
  const project = readUserRecords(PROJECTS_KEY, []).find((item) => item.projectKey === projectKey);
  return restoreProjectLocalState(project);
}

export function consumeNewProjectRequest(search = window.location.search) {
  const params = new URLSearchParams(search || "");
  if (params.get("new") !== "1") return false;
  beginNewProjectSession();
  return true;
}

export function markProjectSessionAsResumed() {
  localStorage.setItem(SESSION_MODE_KEY, RESUME_SESSION_VALUE);
}
