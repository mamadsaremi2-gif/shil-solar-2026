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

export const FLOW_MODES = Object.freeze({
  MANUAL: "manual",
  SCENARIO: "scenario",
  UTILITY: "utility",
});

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function clearScenarioFlow() {
  SCENARIO_KEYS.forEach(safeRemove);
}

export function clearUtilityFlow() {
  UTILITY_KEYS.forEach(safeRemove);
}

export function setWorkflowMode(mode) {
  safeSet("shil:projectCreationMode", mode);
}

export function getWorkflowMode() {
  return safeGet("shil:projectCreationMode") || FLOW_MODES.MANUAL;
}

export function startManualProjectFlow() {
  clearScenarioFlow();
  clearUtilityFlow();
  setWorkflowMode(FLOW_MODES.MANUAL);
  safeSet("shil:calculationDomain", "");
  safeSet("shil:projectScale", "standard");
}

export function startScenarioFlow(scenario) {
  clearUtilityFlow();
  setWorkflowMode(FLOW_MODES.SCENARIO);
  safeSet("shil:scenarioFlowActive", "true");
  safeSet("shil:selectedScenario", JSON.stringify(scenario || {}));
  safeSet("shil:scenarioDomain", scenario?.domain || "solar");
  safeSet("shil:scenarioLevel", scenario?.levelKey || scenario?.level || "");
  safeSet("shil:calculationDomain", scenario?.domain || "solar");
  safeSet("shil:projectScale", "standard");
}

export function startUtilityGateway(reason = "project-path") {
  clearScenarioFlow();
  setWorkflowMode(FLOW_MODES.UTILITY);
  safeSet("shil:utilityGatewayActive", "true");
  safeSet("shil:utilityRedirectReason", reason);
  safeSet("shil:projectScale", "utility");
  safeSet("shil:calculationDomain", "utility");
  safeSet("shil:scenarioDomain", "utility");
}

export function isScenarioFlowFor(domain) {
  if (getWorkflowMode() !== FLOW_MODES.SCENARIO) return false;
  if (safeGet("shil:scenarioFlowActive") !== "true") return false;
  try {
    const scenario = JSON.parse(safeGet("shil:selectedScenario") || "null");
    return Boolean(scenario?.id && (!domain || scenario.domain === domain));
  } catch {
    return false;
  }
}

export function isUtilityGatewayActive() {
  return getWorkflowMode() === FLOW_MODES.UTILITY && safeGet("shil:utilityGatewayActive") === "true";
}

function hasScenarioEquipmentIntent(search = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return params.get("from") === "scenario" || Boolean(params.get("scenarioId")) || params.get("scenarioFlow") === "1";
}

export function getFlowSafeRedirect(pathname = "", search = "") {
  const mode = getWorkflowMode();
  const isEquipmentInputRoute = pathname.includes("/new-project/input/") && pathname.endsWith("/equipment");
  const isScenarioEquipmentRoute = isEquipmentInputRoute && hasScenarioEquipmentIntent(search);
  const isUtilityRoute = pathname.includes("/new-project/system/utility") || pathname.includes("/new-project/utility");

  // مسیر «لیست تجهیزات» دو کاربرد دارد:
  // 1) روش محاسبات دستی برای پروژه جدید معمولی
  // 2) لیست تجهیزات سناریوی آماده بعد از شرایط محیطی
  // قبلاً هر مسیر equipment به عنوان سناریو تشخیص داده می‌شد و پروژه دستی را
  // اشتباه به صفحه انتخاب مسیر برمی‌گرداند. فقط وقتی query واقعاً سناریویی است Guard فعال می‌شود.
  if (isScenarioEquipmentRoute && mode !== FLOW_MODES.SCENARIO) {
    return "/new-project/path?guard=scenario-equipment-blocked";
  }

  if (isUtilityRoute && !isUtilityGatewayActive()) {
    return "/new-project/path?guard=utility-blocked";
  }

  return null;
}
