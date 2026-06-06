import { saveProjectCheckpoint, completeCurrentProject } from "./projectManagement100.js";

export function getUxResumeUrl(pathname = window.location.pathname) {
  return saveProjectCheckpoint(pathname)?.resumeUrl || pathname || "/new-project/path";
}

export function captureCurrentProjectSnapshot(pathname = window.location.pathname, status = "running") {
  return saveProjectCheckpoint(pathname, status);
}

export function markCurrentProjectFinal(extra = {}) {
  return completeCurrentProject(extra);
}

export function showUxToast(message, type = "info") {
  const detail = { message, type, createdAt: Date.now() };
  window.dispatchEvent(new CustomEvent("shil-ux-toast", { detail }));
}
