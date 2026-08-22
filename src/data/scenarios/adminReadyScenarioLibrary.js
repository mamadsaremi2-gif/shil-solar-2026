import { getCachedRuntimeData, loadRuntimeDataKey, RUNTIME_KEYS, saveRuntimeAppData } from "../../services/runtimeAppDataService.js";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeDomain(value) {
  const domain = String(value || "").toLowerCase();
  if (domain.includes("emergency") || domain.includes("backup") || domain.includes("ups")) return "emergency";
  return "solar";
}

function pickProjectSnapshot(project = {}) {
  return project.snapshot && typeof project.snapshot === "object" ? project.snapshot : {};
}

function pickProjectInfo(project = {}) {
  const snapshot = pickProjectSnapshot(project);
  return project.finalOutput?.project || snapshot.project || snapshot.projectInfo || project.project || {};
}

function pickFinalResult(project = {}) {
  const snapshot = pickProjectSnapshot(project);
  return project.finalOutput?.result || snapshot.finalOutput || snapshot.result || project.result || {};
}

function pickSummary(project = {}) {
  const snapshot = pickProjectSnapshot(project);
  return project.finalOutput?.summary || snapshot.summary || project.summary || {};
}

function inferLoadW(project = {}) {
  const result = pickFinalResult(project);
  const summary = pickSummary(project);
  const snapshot = pickProjectSnapshot(project);
  const candidates = [
    result.totalLoadW,
    result.peakLoadW,
    result.loadW,
    result.requiredPowerW,
    summary.totalLoadW,
    summary.peakPowerW,
    snapshot.calculationInputs?.totalLoadW,
    snapshot.calculationInputs?.manualPowerW,
  ];
  for (const value of candidates) {
    const number = toNumber(value, 0);
    if (number > 0) return Math.round(number);
  }
  return 0;
}

function inferDailyWh(project = {}) {
  const result = pickFinalResult(project);
  const summary = pickSummary(project);
  const snapshot = pickProjectSnapshot(project);
  const candidates = [
    result.dailyEnergyWh,
    result.energyDailyWh,
    summary.dailyEnergyWh,
    snapshot.calculationInputs?.totalDailyWh,
    snapshot.calculationInputs?.manualEnergyKWh ? toNumber(snapshot.calculationInputs.manualEnergyKWh, 0) * 1000 : 0,
  ];
  for (const value of candidates) {
    const number = toNumber(value, 0);
    if (number > 0) return Math.round(number);
  }
  return 0;
}

function inferLevel(loadW) {
  if (loadW > 5000) return "heavy";
  if (loadW > 1500) return "medium";
  return "light";
}

function extractRecommendedEquipment(project = {}) {
  const snapshot = pickProjectSnapshot(project);
  const selected = snapshot.calculationInputs?.selectedItems || snapshot.calculationInputs?.equipment || project.selectedItems || [];
  if (!Array.isArray(selected)) return [];
  return selected.map((item) => item?.title || item?.name || item?.item).filter(Boolean).slice(0, 40);
}

export function projectToReadyScenario(project = {}) {
  const domain = normalizeDomain(project.domain || pickProjectSnapshot(project).domain || pickProjectInfo(project).domain);
  const loadEstimate = inferLoadW(project);
  const dailyEnergyWh = inferDailyWh(project);
  const levelKey = inferLevel(loadEstimate);
  const projectInfo = pickProjectInfo(project);
  const result = pickFinalResult(project);
  const sourceId = project.id || project.projectKey || `project-${Date.now()}`;
  const title = project.projectName || projectInfo.projectName || projectInfo.name || project.title || (domain === "emergency" ? "سناریوی برق اضطراری" : "سناریوی خورشیدی");
  const recommendedItems = extractRecommendedEquipment(project);

  return {
    id: `admin-${domain}-${sourceId}`,
    source: "admin-approved-project",
    sourceProjectId: sourceId,
    domain,
    levelKey,
    level: levelKey === "heavy" ? "سنگین" : levelKey === "medium" ? "متوسط" : "سبک",
    category: domain === "emergency" ? "پروژه های برق اضطراری" : "پروژه های انرژی خورشیدی",
    title,
    description: `سناریوی واقعی تاییدشده توسط ادمین SHIL${project.userLogin ? ` از پروژه ${project.userLogin}` : ""}.`,
    city: projectInfo.city || project.city || "",
    province: projectInfo.province || project.province || "",
    loadEstimate,
    dailyEnergyWh,
    backupHours: toNumber(result.backupHours || pickSummary(project).backupHours, domain === "emergency" ? 3 : 0),
    autonomyDays: toNumber(result.autonomyDays || pickSummary(project).autonomyDays, 1),
    inverter: result.inverter?.title || result.inverterTitle || result.inverter || (domain === "emergency" ? "اینورتر برق اضطراری" : "اینورتر خورشیدی"),
    inverterRatedW: toNumber(result.inverterRatedW || result.inverterPowerW, 0),
    batteryType: result.batteryType || result.battery?.chemistry || "",
    suggestedBattery: result.suggestedBattery || result.batteryTitle || "",
    suggestedBatteryAh: toNumber(result.suggestedBatteryAh || result.batteryAh, 0),
    suggestedPanels: toNumber(result.suggestedPanels || result.panelCount, 0),
    calculationEngine: domain,
    defaultEnvironment: pickProjectSnapshot(project).environment || {},
    requiredEquipment: {
      recommendedItems,
      loadW: loadEstimate,
      dailyWh: dailyEnergyWh,
    },
    adminPublishedAt: new Date().toISOString(),
    sourceProject: project,
  };
}

export function getCachedAdminReadyScenarios() {
  const value = getCachedRuntimeData(RUNTIME_KEYS.readyScenarios, []);
  return Array.isArray(value) ? value : [];
}

export async function loadAdminReadyScenarios() {
  const value = await loadRuntimeDataKey(RUNTIME_KEYS.readyScenarios, []);
  return Array.isArray(value) ? value : [];
}

export async function publishProjectAsReadyScenario(project) {
  const scenario = projectToReadyScenario(project);
  const current = await loadAdminReadyScenarios();
  const next = [scenario, ...current.filter((item) => item.id !== scenario.id && item.sourceProjectId !== scenario.sourceProjectId)];
  await saveRuntimeAppData(RUNTIME_KEYS.readyScenarios, next);
  return scenario;
}
