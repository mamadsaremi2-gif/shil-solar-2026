
import { readUserRecords, upsertUserRecord, updateUserRecord, deleteUserRecord } from "../auth/session.js";
import { getStepKeyFromPath, readWorkflowState } from "./projectWorkflow.js";

const PROJECTS_KEY = "shil-projects";
const ACTIVE_KEY = "shil:activeProjectKey";

function safeParse(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function makeProjectKey() {
  const current = localStorage.getItem(ACTIVE_KEY);
  if (current) return current;
  const next = `draft-${Date.now()}`;
  localStorage.setItem(ACTIVE_KEY, next);
  return next;
}

function getDomain() {
  const selectedPath = safeParse("shil:selectedProjectPath", {});
  return localStorage.getItem("shil:calculationDomain") || selectedPath.calculationDomain || selectedPath.key || "solar";
}

function getTitle(domain) {
  const project = safeParse("shil:projectInfoDraft", {});
  return project.projectName || project.name || project.title || (domain === "emergency" ? "پروژه برق اضطراری" : "پروژه خورشیدی");
}

function normalizeResumeUrl(pathname, domain, step) {
  if (domain === "emergency") {
    if (["path", "method", "inputs", "system", "summary"].includes(step)) return "/new-project/summary/emergency";
    if (step === "run") return "/new-project/run/emergency";
  }
  if (step === "system") return "/new-project/system/solar";
  if (step === "summary") return `/new-project/summary/${domain === "emergency" ? "emergency" : "solar"}`;
  if (step === "run") return `/new-project/run/${domain === "emergency" ? "emergency" : "solar"}`;
  return pathname || "/new-project/info";
}

export function buildProjectSnapshot(pathname = window.location.pathname, status = "running") {
  if (!pathname.startsWith("/new-project")) return null;
  // The path-selection screen is only the entry point. Do not create or
  // rewrite a running-project snapshot before the user has selected a route.
  // This also prevents unnecessary storage work during the first mobile render.
  if (pathname === "/new-project" || pathname === "/new-project/path" || pathname.includes("/future")) return null;
  const domain = getDomain();
  const step = getStepKeyFromPath(pathname) || "info";
  const projectKey = makeProjectKey();
  const now = new Date().toISOString();
  const selectedPath = safeParse("shil:selectedProjectPath", {});
  const project = safeParse("shil:projectInfoDraft", {});
  const snapshot = {
    project,
    environment: safeParse("shil:environmentDraft", {}),
    selectedPath,
    calculationInputs: safeParse("shil:calculationInputsDraft", {}),
    systemSettings: safeParse("shil:systemSettingsDraft", {}),
    summary: safeParse("shil:summaryDraft", {}),
    aiPreview: safeParse("shil:aiInstallationPreview", {}),
    finalOutput: safeParse("shil:finalEngineeringOutput", {}),
    workflow: readWorkflowState(),
    lastRoute: pathname,
  };
  return {
    projectKey,
    title: getTitle(domain),
    status,
    domain,
    currentStep: step,
    resumeUrl: normalizeResumeUrl(pathname, domain, step),
    lastVisitedAt: now,
    updatedAt: now,
    snapshot,
  };
}

export function saveProjectCheckpoint(pathname = window.location.pathname, status = "running") {
  const patch = buildProjectSnapshot(pathname, status);
  if (!patch) return null;
  return upsertUserRecord(PROJECTS_KEY, (item) => item.projectKey === patch.projectKey, patch);
}

export function completeCurrentProject(extra = {}) {
  const pathname = window.location.pathname || "/new-project/run";
  const patch = buildProjectSnapshot(pathname, "final");
  if (!patch) return null;
  const completed = {
    ...patch,
    status: "final",
    currentStep: "run",
    completedAt: new Date().toISOString(),
    resumeUrl: patch.domain === "emergency" ? "/new-project/run/emergency" : "/new-project/run/solar",
    finalOutput: {
      project: safeParse("shil:projectInfoDraft", {}),
      summary: safeParse("shil:summaryDraft", {}),
      result: safeParse("shil:finalEngineeringOutput", {}),
      aiPreview: safeParse("shil:aiInstallationPreview", {}),
      ...extra,
    },
  };
  return upsertUserRecord(PROJECTS_KEY, (item) => item.projectKey === completed.projectKey, completed);
}

export function listManagedProjects(type = "all") {
  const list = readUserRecords(PROJECTS_KEY, []);
  return list
    .filter((item) => {
      if (type === "final") return item.status === "final";
      if (type === "running") return item.status !== "final" && item.status !== "archived";
      if (type === "archived") return item.status === "archived";
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt || b.lastVisitedAt || b.createdAt || 0) - new Date(a.updatedAt || a.lastVisitedAt || a.createdAt || 0));
}

export function archiveManagedProject(projectKey) {
  return updateUserRecord(PROJECTS_KEY, (item) => item.projectKey === projectKey, { status: "archived", archivedAt: new Date().toISOString() });
}

export function restoreManagedProject(projectKey) {
  return updateUserRecord(PROJECTS_KEY, (item) => item.projectKey === projectKey, { status: "running", restoredAt: new Date().toISOString() });
}

export function deleteManagedProject(projectKey) {
  return deleteUserRecord(PROJECTS_KEY, (item) => item.projectKey === projectKey);
}

export function exportManagedProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.projectKey || "shil-project"}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
