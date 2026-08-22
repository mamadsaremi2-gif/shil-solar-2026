const SCENARIO_KEYS = [
  "shil:scenarioFlowActive",
  "shil:selectedScenario",
  "shil:scenarioNextStep",
  "shil:scenarioEquipmentBranch",
  "shil:scenarioEquipmentConfirmed",
  "shil:scenarioDomain",
  "shil:scenarioLevel",
  "shil:engineeringFormDraft",
];

const UTILITY_KEYS = [
  "shil:utilityGatewayActive",
  "shil:utilityRedirectReason",
];

const PATH_DRAFT_KEYS = [
  "shil:systemSetupHandoff",
  "shil:systemSettingsDraft",
  "shil:finalEngineeringOutput",
  "shil:solarSystemDesign",
  "shil:unifiedPvEngineResult",
  "shil:solarPanelPowerInput",
  "shil:solarPanelPowerPreview",
  "shil:loadEngineResult",
];

export const PROJECT_PATHS = Object.freeze({
  SOLAR: "solar",
  EMERGENCY: "emergency",
  UTILITY: "utility",
});

export const FLOW_MODES = Object.freeze({
  MANUAL: "manual",
  SCENARIO: "scenario",
});

function safeRemove(key) { try { localStorage.removeItem(key); } catch { /* noop */ } }
function safeSet(key, value) { try { localStorage.setItem(key, value); } catch { /* noop */ } }
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeJson(key, fallback = null) { try { return JSON.parse(safeGet(key) || "null") ?? fallback; } catch { return fallback; } }
function safeSetJson(key, value) { safeSet(key, JSON.stringify(value)); }

export function clearScenarioFlow() { SCENARIO_KEYS.forEach(safeRemove); }
export function clearUtilityFlow() { UTILITY_KEYS.forEach(safeRemove); }
export function clearPathDrafts() { PATH_DRAFT_KEYS.forEach(safeRemove); }
export function setWorkflowMode(mode) { safeSet("shil:projectCreationMode", mode); }
export function getWorkflowMode() { return safeGet("shil:projectCreationMode") || FLOW_MODES.MANUAL; }

export function getProjectPathDomain() {
  const path = safeJson("shil:projectPath", null) || safeJson("shil:selectedProjectPath", null);
  if (typeof path === "string") return path;
  return path?.domain || path?.type || safeGet("shil:calculationDomain") || PROJECT_PATHS.SOLAR;
}

export function startManualProjectFlow(domain = null) {
  const existing =
    safeJson("shil:selectedProjectPath", null) ||
    safeJson("shil:projectPath", null);

  const inferred =
    domain ||
    (typeof existing === "string" ? existing : existing?.domain || existing?.type || existing?.key) ||
    PROJECT_PATHS.SOLAR;

  const normalized = [PROJECT_PATHS.SOLAR, PROJECT_PATHS.EMERGENCY, PROJECT_PATHS.UTILITY].includes(inferred)
    ? inferred
    : PROJECT_PATHS.SOLAR;

  clearScenarioFlow();
  clearUtilityFlow();
  clearPathDrafts();
  setWorkflowMode(FLOW_MODES.MANUAL);

  safeSet("shil:calculationDomain", normalized);
  safeSet("shil:scenarioDomain", normalized);
  safeSet("shil:projectEngine", normalized);
  safeSet("shil:projectScale", normalized === PROJECT_PATHS.UTILITY ? "utility" : "standard");

  const payload = {
    domain: normalized,
    type: normalized,
    key: normalized,
    mode: FLOW_MODES.MANUAL,
  };

  safeSetJson("shil:projectPath", payload);
  safeSetJson("shil:selectedProjectPath", payload);
}

export function startSolarProject() { startManualProjectFlow(PROJECT_PATHS.SOLAR); }
export function startEmergencyProject() { startManualProjectFlow(PROJECT_PATHS.EMERGENCY); }
export function startUtilityProject(reason = "project-path") {
  startManualProjectFlow(PROJECT_PATHS.UTILITY);
  safeSet("shil:utilityGatewayActive", "true");
  safeSet("shil:utilityRedirectReason", reason);
}

export function startScenarioFlow(scenario) {
  clearUtilityFlow();
  clearPathDrafts();
  setWorkflowMode(FLOW_MODES.SCENARIO);
  const domain = scenario?.domain || PROJECT_PATHS.SOLAR;
  safeSet("shil:scenarioFlowActive", "true");
  safeSetJson("shil:selectedScenario", scenario || {});
  safeSet("shil:scenarioDomain", domain);
  safeSet("shil:scenarioLevel", scenario?.levelKey || scenario?.level || "");
  safeSet("shil:calculationDomain", domain);
  safeSet("shil:projectEngine", domain);
  safeSet("shil:projectScale", domain === PROJECT_PATHS.UTILITY ? "utility" : "standard");
  safeSetJson("shil:projectPath", { domain, type: domain, mode: FLOW_MODES.SCENARIO });
}

export function startUtilityGateway(reason = "project-path") { startUtilityProject(reason); }

export function isScenarioFlowFor(domain) {
  if (getWorkflowMode() !== FLOW_MODES.SCENARIO) return false;
  if (safeGet("shil:scenarioFlowActive") !== "true") return false;
  try {
    const scenario = JSON.parse(safeGet("shil:selectedScenario") || "null");
    return Boolean(scenario?.id && (!domain || scenario.domain === domain));
  } catch { return false; }
}

export function isUtilityGatewayActive() { return getProjectPathDomain() === PROJECT_PATHS.UTILITY && safeGet("shil:utilityGatewayActive") === "true"; }

function hasScenarioEquipmentIntent(search = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return params.get("from") === "scenario" || Boolean(params.get("scenarioId")) || params.get("scenarioFlow") === "1";
}

export function getFlowSafeRedirect(pathname = "", search = "") {
  const mode = getWorkflowMode();
  const domain = getProjectPathDomain();
  const isEquipmentInputRoute = pathname.includes("/new-project/input/") && pathname.endsWith("/equipment");
  const isScenarioEquipmentRoute = isEquipmentInputRoute && hasScenarioEquipmentIntent(search);
  const isUtilityRoute = pathname.includes("/new-project/system/utility") || pathname.includes("/new-project/utility");
  const isEmergencyRoute = pathname.includes("/new-project/system/emergency") || pathname.includes("/new-project/emergency");
  const isSolarSystemRoute = pathname.includes("/new-project/system/solar");

  if (isScenarioEquipmentRoute && mode !== FLOW_MODES.SCENARIO) return "/new-project/path?guard=scenario-equipment-blocked";
  if (isUtilityRoute && domain !== PROJECT_PATHS.UTILITY) return "/new-project/path?guard=utility-blocked";
  if (isEmergencyRoute && domain !== PROJECT_PATHS.EMERGENCY) return "/new-project/path?guard=emergency-blocked";
  if (isSolarSystemRoute && domain !== PROJECT_PATHS.SOLAR) return "/new-project/path?guard=solar-blocked";
  return null;
}

