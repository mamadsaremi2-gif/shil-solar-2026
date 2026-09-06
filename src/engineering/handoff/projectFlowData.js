import { readLocalOrSessionItem, safeLocalSetItem } from "../../services/storageQuotaGuard.js";
const hasLocalStorage = () => typeof window !== "undefined";

export function readJson(key, fallback = null) {
  try {
    if (!hasLocalStorage()) return fallback;
    const value = JSON.parse(readLocalOrSessionItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  if (hasLocalStorage()) safeLocalSetItem(key, JSON.stringify(value));
  return value;
}

export function getProjectPath() {
  const raw = readJson("shil:projectPath", null) || readJson("shil:selectedProjectPath", null);
  if (typeof raw === "string") return { domain: raw, type: raw };
  return raw || { domain: hasLocalStorage() ? readLocalOrSessionItem("shil:calculationDomain") || "solar" : "solar" };
}

export function getSystemSetupHandoff() {
  const projectPath = getProjectPath();
  return readJson("shil:systemSetupHandoff", null) || {
    source: {
      projectPath: projectPath.domain || "solar",
      domain: projectPath.domain || "solar",
      method: hasLocalStorage() ? readLocalOrSessionItem("shil:calculationMethod") || "equipment" : "equipment",
      from: "legacy-local-storage",
    },
    normalizedLoad: readJson("shil:loadEngineResult", {}),
    routePayload: readJson("shil:solarPanelPowerInput", {}),
    environmentSnapshot: readJson("shil:environmentDraft", {}),
    methodSummary: readJson("shil:methodSummary", null),
  };
}

export function getSystemSettingsDraft() {
  return readJson("shil:systemSettingsDraft", null) || readJson("shil:solarSystemDesign", null) || null;
}

export function getFinalEngineeringOutput() {
  return readJson("shil:finalEngineeringOutput", null);
}

export function normalizeProjectDomain(value) {
  const domain = value?.source?.projectPath || value?.source?.domain || value?.domain || getProjectPath().domain || "solar";
  if (domain === "emergency") return "emergency";
  if (domain === "utility") return "utility";
  return "solar";
}
