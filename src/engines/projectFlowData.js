export function readJson(key, fallback = null) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getProjectPath() {
  const raw = readJson("shil:projectPath", null) || readJson("shil:selectedProjectPath", null);
  if (typeof raw === "string") return { domain: raw, type: raw };
  return raw || { domain: localStorage.getItem("shil:calculationDomain") || "solar" };
}

export function getSystemSetupHandoff() {
  return readJson("shil:systemSetupHandoff", null) || {
    source: {
      projectPath: getProjectPath().domain || "solar",
      domain: getProjectPath().domain || "solar",
      method: localStorage.getItem("shil:calculationMethod") || "equipment",
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
