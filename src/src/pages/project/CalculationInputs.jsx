import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import ShilWarningOverlay from "../../components/ShilWarningOverlay.jsx";
import { consumerEquipmentLibrary, searchConsumerEquipment } from "../../data/catalogs/consumerEquipmentLibrary.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { METHOD_LABELS, persistSurfaceLoadPreview as persistLoadEngineResult, runSurfaceLoadPreview as runLoadEngine, runSurfacePvPreview as runUnifiedPvForUi } from "../../calculationGateway/surfacePreviewData.js";
import { SHIL_SOLAR_PANELS } from "../../data/shilSolarBanks.js";
import { isScenarioFlowFor, startUtilityGateway } from "../../workflow/flowIsolation.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function normalizePersianInput(value) {
  return String(value ?? "")
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
    .replace(/,/g, "")
    .trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(normalizePersianInput(value));
  return Number.isFinite(n) ? n : fallback;
}

function enNumber(value, digits = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function enValue(value, unit = "", digits = 0) {
  return `${enNumber(value, digits)}${unit ? ` ${unit}` : ""}`;
}

function clampNumber(value, fallback, min, max) {
  const n = toNumber(value, fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getEnvironmentSolarDefaults(environment = {}, assessment = {}) {
  const psh = clampNumber(environment.peakSunHours ?? environment.sunHours ?? assessment.peakSunHours, 5, 2.5, 7.5);
  const thermal = clampNumber(environment.thermalDeratePercent ?? assessment.thermalDeratePercent, 6, 0, 25);
  const soiling = clampNumber(environment.soilingLossPercent ?? assessment.soilingLossPercent, 4, 0, 18);
  const wiring = clampNumber(environment.wiringLossPercent ?? assessment.wiringLossPercent, 3, 0, 8);
  const orientation = clampNumber(environment.totalOrientationLossPercent ?? assessment.totalOrientationLossPercent, 0, 0, 55);
  const tilt = clampNumber(environment.tiltLossPercent ?? assessment.tiltLossPercent, 0, 0, 20);
  const azimuth = clampNumber(environment.orientationLossPercent ?? assessment.orientationLossPercent, 0, 0, 45);
  const safety = 3;
  const totalLoss = clampNumber(environment.totalLossPercent ?? assessment.totalLossPercent ?? (thermal + soiling + wiring + orientation + safety), 15, 4, 60);
  const effectiveEfficiency = clampNumber(environment.effectiveEfficiency ?? assessment.effectiveEfficiency ?? (1 - totalLoss / 100), 0.8, 0.35, 1);
  return { psh, totalLoss, thermal, soiling, wiring, orientation, tilt, azimuth, safety, effectiveEfficiency };
}

function getProjectPathKey(projectPathDraft, fallbackDomain) {
  if (typeof projectPathDraft === "string") return projectPathDraft;
  return projectPathDraft?.key || projectPathDraft?.type || projectPathDraft?.domain || fallbackDomain;
}

function resolveEffectiveDomain({ domain, method, effectivePanelPowerW, projectPathDraft }) {
  const projectPathKey = getProjectPathKey(projectPathDraft, domain);
  const utilityByPath = /utility|power-plant|plant|نیروگاهی/i.test(String(projectPathKey));
  const utilityByScale = method === "solar_panel_power" && Number(effectivePanelPowerW || 0) > 30000;
  return domain === "utility" || utilityByPath || utilityByScale ? "utility" : domain;
}

function buildAutonomySnapshot({ domain, method, manualHours, autonomyHours, autonomyDays, forceAutonomyBattery }) {
  const inputHours = Math.max(0, toNumber(autonomyHours, 0));
  const inputDays = Math.max(0, toNumber(autonomyDays, 0));
  const manualBackupHours = domain === "emergency" ? Math.max(0, toNumber(manualHours, 0)) : 0;
  const effectiveHours = domain === "emergency" ? Math.max(inputHours, manualBackupHours) : inputHours;
  const totalHours = Number((effectiveHours + inputDays * 24).toFixed(2));
  const isRequired = Boolean(forceAutonomyBattery) || effectiveHours > 0 || inputDays > 0 || domain === "emergency";
  const reason = domain === "emergency"
    ? "emergency_backup_required"
    : effectiveHours > 0 || inputDays > 0
      ? "autonomy_required"
      : forceAutonomyBattery
        ? "user_requested_storage"
        : "not_required_at_input_step";
  return {
    required: isRequired,
    reason,
    hours: Number(effectiveHours.toFixed(2)),
    days: Number(inputDays.toFixed(2)),
    totalHours,
    inputHours,
    inputDays,
    backupHours: manualBackupHours,
    source: method === "solar_panel_power" ? "pv_generation_route" : "load_route",
  };
}

function mergeItemWithOverride(item, override = {}) {
  return {
    ...item,
    ...override,
    quantity: Number(override.quantity ?? item.quantity ?? 1) || 1,
    usageHoursPerDay: Number(override.usageHoursPerDay ?? item.usageHoursPerDay ?? 0) || 0,
    hasSoftStarter: Boolean(override.hasSoftStarter ?? item.hasSoftStarter ?? false),
  };
}

function matchScenarioEquipmentItems(scenario) {
  if (!scenario?.requiredEquipment?.recommendedItems?.length) return [];
  const wanted = scenario.requiredEquipment.recommendedItems.map((item) => String(item).trim()).filter(Boolean);
  const picked = [];
  const used = new Set();

  for (const label of wanted) {
    const exact = consumerEquipmentLibrary.find((item) =>
      !used.has(item.id) && (item.title.includes(label) || item.category.includes(label))
    );
    const fallback = consumerEquipmentLibrary.find((item) =>
      !used.has(item.id) && (label.includes(item.category) || item.title.includes(label.split(" ")[0] || label))
    );
    const selected = exact || fallback;
    if (selected) {
      used.add(selected.id);
      picked.push(selected);
    }
  }

  if (!picked.length && scenario.domain === "solar") {
    return consumerEquipmentLibrary.filter((item) => ["eq-001", "eq-003", "eq-022"].includes(item.id));
  }

  if (!picked.length && scenario.domain === "emergency") {
    return consumerEquipmentLibrary.filter((item) =>
      ["لامپ LED", "روشنایی اضطراری", "مودم اینترنت", "دوربین مداربسته", "یخچال خانگی"].some((label) => item.title.includes(label))
    ).slice(0, 5);
  }

  return picked;
}

function buildScenarioEquipmentOverrides(scenario, items) {
  if (!items.length) return {};
  const targetPowerW = Number(scenario?.loadEstimate || 0);
  const targetDailyWh = Number(scenario?.dailyEnergyWh || 0);
  const basePowerW = items.reduce((sum, item) => sum + Number(item.ratedPowerW || 0), 0) || 1;
  const baseDailyWh = items.reduce((sum, item) => sum + Number(item.energyDailyWh || 0), 0) || 1;
  const powerFactor = targetPowerW > 0 ? Math.max(1, Math.round(targetPowerW / basePowerW)) : 1;
  const energyFactor = targetDailyWh > 0 ? Math.max(1, Math.round(targetDailyWh / baseDailyWh)) : 1;
  const scenarioFactor = Math.max(1, Math.min(20, Math.round((powerFactor + energyFactor) / 2)));

  return Object.fromEntries(items.map((item) => [
    item.id,
    {
      quantity: scenarioFactor,
      usageHoursPerDay: item.usageHoursPerDay,
      hasSoftStarter: false,
      scenarioSeeded: true,
    },
  ]));
}

export default function CalculationInputs() {
  const navigate = useNavigate();
  const params = useParams();
  const domain = params.domain || localStorage.getItem("shil:calculationDomain") || localStorage.getItem("shil:scenarioDomain") || "solar";
  const requestedMethod = params.method || localStorage.getItem("shil:calculationMethod") || "equipment";
  const allowedMethodsByDomain = React.useMemo(() => ({
    emergency: ["current", "power", "equipment"],
    utility: ["utility_scale", "solar_panel_power"],
    solar: ["power", "current", "solar_panel_power", "equipment", "profile", "energy"],
  }), []);
  const method = (allowedMethodsByDomain[domain] || allowedMethodsByDomain.solar).includes(requestedMethod)
    ? requestedMethod
    : domain === "emergency"
      ? "equipment"
      : domain === "utility"
        ? "utility_scale"
        : "equipment";

  React.useEffect(() => {
    if (requestedMethod !== method) {
      localStorage.setItem("shil:calculationMethod", method);
      localStorage.setItem("shil:calculationDomain", domain);
    }
  }, [requestedMethod, method, domain]);

  const [query, setQuery] = React.useState("");
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = React.useState(false);
  const [scaleWarning, setScaleWarning] = React.useState("");
  const scenario = React.useMemo(() => readDraft("shil:selectedScenario"), []);
  const scenarioSeededItems = React.useMemo(() => matchScenarioEquipmentItems(scenario), [scenario]);
  const isReadyScenarioEquipmentFlow = isScenarioFlowFor(domain) && method === "equipment" && ["solar", "emergency"].includes(domain);

  const [selectedIds, setSelectedIds] = React.useState(() => new Set(isReadyScenarioEquipmentFlow ? scenarioSeededItems.map((item) => item.id) : []));
  const [itemOverrides, setItemOverrides] = React.useState(() => isReadyScenarioEquipmentFlow ? buildScenarioEquipmentOverrides(scenario, scenarioSeededItems) : {});
  const [showExpert, setShowExpert] = React.useState(false);
  const [manualEnergyKWh, setManualEnergyKWh] = React.useState("");
  const [manualPowerW, setManualPowerW] = React.useState("");
  const [manualCurrentA, setManualCurrentA] = React.useState("");
  const [manualVoltage, setManualVoltage] = React.useState(domain === "emergency" ? "220" : "220");
  const [manualHours, setManualHours] = React.useState(domain === "emergency" ? "6" : "5");
  const [profileVoltage, setProfileVoltage] = React.useState("220");
  const [profilePowerW, setProfilePowerW] = React.useState("1000");
  const [profileMorningKWh, setProfileMorningKWh] = React.useState("1");
  const [profileNoonKWh, setProfileNoonKWh] = React.useState("1");
  const [profileEveningKWh, setProfileEveningKWh] = React.useState("2");
  const [profileNightKWh, setProfileNightKWh] = React.useState("1");
  const [profileStartFactor, setProfileStartFactor] = React.useState("1.6");

  const environment = React.useMemo(() => readDraft("shil:environmentDraft") || {}, []);
  const environmentAssessment = React.useMemo(() => readDraft("shil:environmentAssessment") || {}, []);
  const envSolarDefaults = React.useMemo(() => getEnvironmentSolarDefaults(environment, environmentAssessment), [environment, environmentAssessment]);

  const defaultPanel = SHIL_SOLAR_PANELS.find((p) => p.powerW === 620) || SHIL_SOLAR_PANELS[0];
  const [selectedPanelId, setSelectedPanelId] = React.useState(defaultPanel?.id || "");
  const [panelCount, setPanelCount] = React.useState("10");
  const [psh, setPsh] = React.useState(String(envSolarDefaults.psh));
  const [lossPercent, setLossPercent] = React.useState(String(envSolarDefaults.totalLoss));
  const [acVoltageRoute, setAcVoltageRoute] = React.useState("220");
  const [inverterSplitCount, setInverterSplitCount] = React.useState("1");
  const [forceAutonomyBattery, setForceAutonomyBattery] = React.useState(domain === "emergency");
  const [autonomyHours, setAutonomyHours] = React.useState(domain === "emergency" ? "6" : "");
  const [autonomyDays, setAutonomyDays] = React.useState("");

  const items = React.useMemo(() => {
    const results = searchConsumerEquipment(query);
    return results.slice(0, 250);
  }, [query]);

  const selectedItems = React.useMemo(() => {
    return consumerEquipmentLibrary
      .filter((item) => selectedIds.has(item.id))
      .map((item) => mergeItemWithOverride(item, itemOverrides[item.id]));
  }, [selectedIds, itemOverrides]);

  const selectedPanel = React.useMemo(() => SHIL_SOLAR_PANELS.find((item) => item.id === selectedPanelId) || defaultPanel || {}, [selectedPanelId, defaultPanel]);
  const panelPowerW = toNumber(selectedPanel.powerW, 0);
  const totalPanelPowerW = toNumber(panelPowerW, 0) * toNumber(panelCount, 0);
  const inverterCountNormalized = Math.max(1, Math.round(toNumber(inverterSplitCount, 1)));
  const panelCountNormalized = Math.max(0, Math.round(toNumber(panelCount, 0)));
  const rawPvDailyKWh = Number(((totalPanelPowerW / 1000) * toNumber(psh, 0)).toFixed(2));
  const lossRatio = Math.min(0.95, Math.max(0, toNumber(lossPercent, 0) / 100));
  const effectivePanelPowerW = Number((totalPanelPowerW * (1 - lossRatio)).toFixed(2));
  const calculatedPvDailyKWh = Number((rawPvDailyKWh * (1 - lossRatio)).toFixed(2));
  // معیار ورود به مسیر نیروگاهی فقط توان موثر پس از تلفات/راندمان محیطی است؛
  // ضریب راه‌اندازی و توان خام پنل نباید مسیر را نیروگاهی کنند.
  const isUtilityPanelScale = effectivePanelPowerW > 30000;
  const defaultPanelDistribution = React.useMemo(() => {
    const invCount = Math.max(1, Math.round(toNumber(inverterSplitCount, 1)));
    const total = Math.max(0, Math.round(toNumber(panelCount, 0)));
    const base = Math.floor(total / invCount);
    const rest = total % invCount;
    return Array.from({ length: invCount }, (_, index) => base + (index < rest ? 1 : 0));
  }, [panelCount, inverterSplitCount]);

  const [showManualPanelSplit, setShowManualPanelSplit] = React.useState(false);
  const [manualPanelDistribution, setManualPanelDistribution] = React.useState([]);

  React.useEffect(() => {
    setManualPanelDistribution((prev) => {
      const invCount = Math.max(1, Math.round(toNumber(inverterSplitCount, 1)));
      const next = Array.from({ length: invCount }, (_, index) => toNumber(prev[index] ?? defaultPanelDistribution[index] ?? 0, 0));
      return next;
    });
  }, [inverterSplitCount, defaultPanelDistribution]);

  const activePanelDistribution = showManualPanelSplit ? manualPanelDistribution : defaultPanelDistribution;
  const distributionTotal = activePanelDistribution.reduce((sum, value) => sum + toNumber(value, 0), 0);
  const distributionMismatch = showManualPanelSplit && distributionTotal !== panelCountNormalized;

  const inverterPanelLayouts = React.useMemo(() => {
    return activePanelDistribution.map((panelQty, index) => {
      const count = Math.max(0, Math.round(toNumber(panelQty, 0)));
      const series = count > 0 ? Math.max(1, Math.min(count, Math.round(Math.sqrt(count)))) : 0;
      const parallel = count > 0 ? Math.ceil(count / Math.max(1, series)) : 0;
      const powerKW = Number(((count * panelPowerW) / 1000).toFixed(2));
      return { index: index + 1, count, series, parallel, powerKW };
    });
  }, [activePanelDistribution, panelPowerW]);


  const profileBucketsWh = React.useMemo(() => ({
    morning: Math.max(0, toNumber(profileMorningKWh, 0) * 1000),
    noon: Math.max(0, toNumber(profileNoonKWh, 0) * 1000),
    evening: Math.max(0, toNumber(profileEveningKWh, 0) * 1000),
    night: Math.max(0, toNumber(profileNightKWh, 0) * 1000),
  }), [profileMorningKWh, profileNoonKWh, profileEveningKWh, profileNightKWh]);

  const profileTotalEnergyWh = React.useMemo(() => Object.values(profileBucketsWh).reduce((sum, value) => sum + value, 0), [profileBucketsWh]);
  const profilePeakBucketWh = React.useMemo(() => Math.max(...Object.values(profileBucketsWh), 0), [profileBucketsWh]);
  const profilePeakPowerW = React.useMemo(() => Math.max(toNumber(profilePowerW, 0), profilePeakBucketWh / 3), [profilePowerW, profilePeakBucketWh]);
  const profileSurgePowerW = React.useMemo(() => Math.round(profilePeakPowerW * Math.max(1, toNumber(profileStartFactor, 1.6))), [profilePeakPowerW, profileStartFactor]);

  const profileLoadProfile = React.useMemo(() => ({
    buckets: profileBucketsWh,
    peakBucket: Object.entries(profileBucketsWh).sort((a, b) => b[1] - a[1])[0]?.[0] || "evening",
    peakHours: [18, 19, 20, 21],
    simultaneityFactor: 1,
  }), [profileBucketsWh]);

  const enginePreview = React.useMemo(() => {
    const voltage = toNumber(method === "solar_panel_power" ? acVoltageRoute : method === "profile" ? profileVoltage : manualVoltage || 220, 220);
    const currentVoltageFactor = voltage >= 380 ? Math.sqrt(3) : 1;
    const powerFromCurrent = method === "current" && manualCurrentA ? Math.round(toNumber(manualCurrentA, 0) * voltage * currentVoltageFactor) : 0;
    const energyFromManual = method === "energy" && manualEnergyKWh ? toNumber(manualEnergyKWh, 0) * 1000 : method === "profile" ? profileTotalEnergyWh : 0;
    const powerFromManual = method === "power" && manualPowerW ? toNumber(manualPowerW, 0) : method === "profile" ? profilePeakPowerW : 0;
    const solarPanelEnergyWh = method === "solar_panel_power" ? calculatedPvDailyKWh * 1000 : 0;
    const solarPanelPowerW = method === "solar_panel_power" ? totalPanelPowerW : 0;
    return runLoadEngine({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: voltage,
      phaseAC: voltage >= 380 ? "three" : "single",
      manualEnergyWh: energyFromManual || solarPanelEnergyWh,
      manualPowerW: powerFromCurrent || powerFromManual || solarPanelPowerW,
      manualHours: toNumber(method === "profile" ? 1 : manualHours || psh || 0, 0),
      manualSurgeW: method === "profile" ? profileSurgePowerW : 0,
      loadProfile: method === "profile" ? profileLoadProfile : undefined,
    });
  }, [domain, method, scenario, environment, environmentAssessment, selectedItems, manualEnergyKWh, manualPowerW, manualCurrentA, manualVoltage, manualHours, panelPowerW, panelCount, psh, acVoltageRoute, totalPanelPowerW, calculatedPvDailyKWh, profileVoltage, profileTotalEnergyWh, profilePeakPowerW, profileSurgePowerW, profileLoadProfile]);

  const solarPanelPreview = React.useMemo(() => {
    if (method !== "solar_panel_power") return null;
    return runUnifiedPvForUi({
      load: { method, totalPowerW: totalPanelPowerW, totalEnergyKWh: calculatedPvDailyKWh, voltageAC: toNumber(acVoltageRoute, 220) },
      environment,
      settings: {
        method: "solar_panel_power",
        calculationMethod: "solar_panel_power",
        panelId: selectedPanelId,
        panelCount: Number(panelCount || 0),
        outputAcVoltage: toNumber(acVoltageRoute, 220),
      },
      solarPanelPowerInput: {
        selectedPanelId,
        panelPowerW: Number(panelPowerW || 0),
        panelCount: Number(panelCount || 0),
        totalPanelPowerW,
        psh: Number(psh || 0),
        lossPercent: Number(lossPercent || 0),
        generatedDailyKWh: calculatedPvDailyKWh,
        acVoltageRoute: toNumber(acVoltageRoute, 220),
      },
    });
  }, [method, selectedPanelId, panelPowerW, panelCount, psh, lossPercent, environment, acVoltageRoute, totalPanelPowerW, calculatedPvDailyKWh]);

  const contextMethodLabel = METHOD_LABELS[method] || method;
  const contextScenarioLabel = scenario?.title || "دستی";
  const contextCityLabel = environment?.city || "اصفهان";
  const manualVoltageNumber = toNumber(manualVoltage || 220, 220);
  const manualPhaseLabel = manualVoltageNumber >= 380 ? "380 ولت سه‌فاز" : "220 ولت تک‌فاز";
  const currentDerivedPowerW = Math.round(toNumber(manualCurrentA, 0) * manualVoltageNumber * (manualVoltageNumber >= 380 ? Math.sqrt(3) : 1));
  const selectedEquipmentTitles = selectedItems.map((item) => item.title).filter(Boolean).join("، ");
  const equipmentStats = React.useMemo(() => {
    const voltage = toNumber(manualVoltage || 220, 220) || 220;
    return selectedItems.reduce((acc, item) => {
      const override = itemOverrides[item.id] || {};
      const qty = Math.max(1, toNumber(override.quantity ?? item.quantity ?? 1, 1));
      const powerW = Math.max(0, toNumber(item.ratedPowerW || item.powerW || 0, 0));
      const hours = Math.max(0, toNumber(override.usageHoursPerDay ?? item.usageHoursPerDay ?? 0, 0));
      const pf = Math.max(0.1, toNumber(override.powerFactor ?? item.powerFactor ?? 0.9, 0.9));
      const isMotor = Boolean(override.isMotor ?? item.isMotor) || item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7 || /موتور|پمپ|کمپرسور|فن|کولر|آسانسور/i.test(String(`${item.title || ""} ${item.category || ""}`));
      const hasSoftStarter = Boolean(override.hasSoftStarter ?? item.hasSoftStarter ?? false);
      const startFactor = isMotor ? (hasSoftStarter ? 1.2 : Math.max(2.5, toNumber(item.startupFactor || item.surgeFactor || 2.5, 2.5))) : 1;
      const nominalCurrentA = voltage > 0 ? (powerW / Math.max(1, voltage * pf)) : 0;
      const runningCurrentA = nominalCurrentA * qty;
      const startCurrentA = nominalCurrentA * startFactor * qty;
      acc.selectedCount += qty;
      acc.totalPowerW += powerW * qty;
      acc.totalEnergyKWh += (powerW * qty * hours) / 1000;
      acc.acCurrentA += runningCurrentA;
      acc.startCurrentA += startCurrentA;
      acc.surgePowerW += powerW * qty * startFactor;
      if (isMotor) acc.motorCount += qty;
      if (hasSoftStarter) acc.softStarterCount += qty;
      return acc;
    }, { selectedCount: 0, totalPowerW: 0, totalEnergyKWh: 0, acCurrentA: 0, startCurrentA: 0, surgePowerW: 0, motorCount: 0, softStarterCount: 0 });
  }, [selectedItems, itemOverrides, manualVoltage]);
  const methodResultTitle = method === "equipment" ? "نتایج لیست تجهیزات" : method === "energy" ? "نتایج انرژی روزانه" : method === "power" ? "نتایج توان کل" : method === "profile" ? "نتایج پروفایل مصرف" : method === "solar_panel_power" ? "نتایج توان پنل خورشیدی" : method === "current" ? "نتایج جریان کل" : "نتایج محاسبات";
  const safeLoadBuckets = enginePreview?.loadProfile?.buckets || profileBucketsWh;


  const projectPathDraft = React.useMemo(() => readDraft("shil:selectedProjectPath") || readDraft("shil:projectPath") || {}, []);
  const effectiveDomain = React.useMemo(() => resolveEffectiveDomain({ domain, method, effectivePanelPowerW, projectPathDraft }), [domain, method, effectivePanelPowerW, projectPathDraft]);
  const isUtilityRoute = effectiveDomain === "utility";
  const autonomySnapshot = React.useMemo(() => buildAutonomySnapshot({ domain: effectiveDomain, method, manualHours, autonomyHours, autonomyDays, forceAutonomyBattery }), [effectiveDomain, method, manualHours, autonomyHours, autonomyDays, forceAutonomyBattery]);

  const buildSystemSetupHandoff = (finalResult) => {
    const voltage = toNumber(method === "solar_panel_power" ? acVoltageRoute : method === "profile" ? profileVoltage : manualVoltage || 220, 220);
    const phase = voltage >= 380 ? "three" : "single";
    const totalPowerW = Math.round(toNumber(
      method === "equipment" ? equipmentStats.totalPowerW :
      method === "current" ? currentDerivedPowerW :
      method === "profile" ? profilePeakPowerW :
      method === "solar_panel_power" ? totalPanelPowerW :
      finalResult?.totalPowerW || manualPowerW,
      0
    ));
    const dailyEnergyKWh = Number(toNumber(
      method === "equipment" ? equipmentStats.totalEnergyKWh :
      method === "energy" ? manualEnergyKWh :
      method === "profile" ? profileTotalEnergyWh / 1000 :
      method === "solar_panel_power" ? calculatedPvDailyKWh :
      finalResult?.totalEnergyKWh || (toNumber(finalResult?.totalEnergyWh, 0) / 1000),
      0
    ).toFixed(2));
    const currentA = voltage > 0 ? Number((totalPowerW / Math.max(1, voltage * (phase === "three" ? Math.sqrt(3) : 1))).toFixed(2)) : 0;
    const surgePowerW = Math.round(toNumber(
      method === "equipment" ? equipmentStats.surgePowerW :
      method === "profile" ? profileSurgePowerW :
      finalResult?.surgePowerW || totalPowerW,
      totalPowerW
    ));

    const routePayloadByMethod = {
      equipment: {
        type: "equipment",
        equipmentItems: selectedItems,
        equipmentStats,
      },
      power: {
        type: "power",
        manualPowerW: toNumber(manualPowerW, 0),
        manualHours: toNumber(manualHours, 0),
      },
      current: {
        type: "current",
        manualCurrentA: toNumber(manualCurrentA, 0),
        voltageAC: voltage,
        derivedPowerW: currentDerivedPowerW,
      },
      energy: {
        type: "energy",
        manualEnergyKWh: toNumber(manualEnergyKWh, 0),
        manualHours: toNumber(manualHours, 0),
      },
      profile: {
        type: "profile",
        voltageAC: toNumber(profileVoltage, 220),
        basePowerW: toNumber(profilePowerW, 0),
        startFactor: toNumber(profileStartFactor, 1.6),
        bucketsWh: profileBucketsWh,
        loadProfile: profileLoadProfile,
      },
      solar_panel_power: {
        type: "solar_panel_power",
        selectedPanelId,
        panelTitle: selectedPanel.title,
        panelPowerW: Number(panelPowerW || 0),
        panelCount: Number(panelCount || 0),
        totalPanelPowerW,
        effectivePanelPowerW,
        generatedDailyKWh: calculatedPvDailyKWh,
        psh: Number(psh || 0),
        lossPercent: Number(lossPercent || 0),
        inverterSplitCount: inverterCountNormalized,
        inverterPanelDistribution: activePanelDistribution.map((value) => toNumber(value, 0)),
        inverterPanelLayouts,
        isUtilityPanelScale,
      },
      utility_scale: {
        type: "utility_scale",
        source: "project_path_utility",
      },
    };

    const sourceDomain = domain;
    const targetDomain = resolveEffectiveDomain({ domain, method, effectivePanelPowerW, projectPathDraft });
    const nextSystemRoute = `/new-project/system/${targetDomain}`;
    const sizingBasis = targetDomain === "utility" ? "utility_pv_generation" : method === "solar_panel_power" ? "pv_generation" : targetDomain === "emergency" ? "backup_load" : "load_consumption";
    const projectPathKey = getProjectPathKey(projectPathDraft, domain);
    const methodSummaryByMethod = {
      equipment: {
        title: targetDomain === "emergency" ? "چکیده مسیر لیست تجهیزات برق اضطراری" : "چکیده مسیر لیست تجهیزات",
        basis: targetDomain === "emergency" ? "backup_load" : "load_consumption",
        keyMetrics: {
          selectedCount: equipmentStats.selectedCount,
          motorCount: equipmentStats.motorCount,
          totalPowerW,
          dailyEnergyKWh,
          surgePowerW,
          currentA,
        },
        nextStepHints: targetDomain === "emergency"
          ? ["انتخاب اینورتر باتری‌محور", "محاسبه ظرفیت باتری بر اساس زمان پشتیبانی", "حفاظت DC باتری و خروجی AC"]
          : ["انتخاب پنل و اینورتر متناسب با مصرف", "بررسی باتری فقط در صورت خودکفایی یا سناریوی آفگرید/هیبرید"],
      },
      power: {
        title: targetDomain === "emergency" ? "چکیده مسیر توان کل برق اضطراری" : "چکیده مسیر توان کل",
        basis: targetDomain === "emergency" ? "backup_power" : "total_power",
        keyMetrics: { totalPowerW, dailyEnergyKWh, voltageAC: voltage, currentA, surgePowerW },
        nextStepHints: targetDomain === "emergency"
          ? ["سایزبندی اینورتر بر اساس توان کل و ضریب اطمینان", "ظرفیت باتری بر اساس ساعت پشتیبانی"]
          : ["تکمیل انرژی روزانه یا ساعت مصرف برای دقت بیشتر", "انتخاب تجهیزات اصلی سیستم خورشیدی"],
      },
      current: {
        title: targetDomain === "emergency" ? "چکیده مسیر جریان کل برق اضطراری" : "چکیده مسیر جریان کل",
        basis: targetDomain === "emergency" ? "backup_current" : "total_current",
        keyMetrics: { currentA, voltageAC: voltage, derivedPowerW: totalPowerW, phaseAC: phase },
        nextStepHints: targetDomain === "emergency"
          ? ["تبدیل جریان به توان بار اضطراری", "انتخاب اینورتر و باتری از بانک موجود"]
          : ["تبدیل جریان به توان و ادامه طراحی بر اساس بار"],
      },
      energy: {
        title: "چکیده مسیر انرژی روزانه",
        basis: "daily_energy",
        keyMetrics: { dailyEnergyKWh, voltageAC: voltage, totalPowerW },
        nextStepHints: ["سایزبندی پنل بر اساس kWh/day", "بررسی نیاز به ذخیره‌ساز در صورت خودکفایی"],
      },
      profile: {
        title: "چکیده مسیر پروفایل مصرف",
        basis: "consumption_profile",
        keyMetrics: {
          dailyEnergyKWh,
          peakPowerW: totalPowerW,
          surgePowerW,
          bucketsWh: profileBucketsWh,
          peakBucket: profileLoadProfile.peakBucket,
        },
        nextStepHints: ["طراحی بر اساس زمان مصرف", "بررسی نیاز ذخیره‌ساز برای مصرف شبانه یا پیک زمانی"],
      },
      solar_panel_power: {
        title: targetDomain === "utility" ? "چکیده مسیر توان پنل نیروگاهی" : "چکیده مسیر توان پنل خورشیدی",
        basis: targetDomain === "utility" ? "utility_pv_generation" : "pv_generation",
        keyMetrics: {
          panelPowerW: Number(panelPowerW || 0),
          panelCount: Number(panelCount || 0),
          totalPanelPowerW,
          effectivePanelPowerW,
          generatedDailyKWh: calculatedPvDailyKWh,
          psh: Number(psh || 0),
          lossPercent: Number(lossPercent || 0),
        },
        nextStepHints: targetDomain === "utility"
          ? ["ورود به تنظیمات اختصاصی نیروگاهی", "عدم نمایش مسیر مصرف‌محور خورشیدی"]
          : ["انتخاب اینورتر و آرایش MPPT/String", "باتری فقط در صورت خودکفایی یا سناریوی ذخیره‌ساز"],
      },
      utility_scale: {
        title: "چکیده مسیر نیروگاهی",
        basis: "utility_scale",
        keyMetrics: { totalPowerW, dailyEnergyKWh },
        nextStepHints: ["ادامه در صفحه تنظیمات نیروگاهی موقت"],
      },
    };

    return {
      schemaVersion: 2,
      source: {
        domain: targetDomain,
        originalDomain: sourceDomain,
        method,
        methodTitle: METHOD_LABELS[method] || method,
        projectPath: projectPathKey,
        projectPathTitle: typeof projectPathDraft === "object" ? projectPathDraft?.title : undefined,
        from: "calculation-inputs",
        createdAt: new Date().toISOString(),
      },
      normalizedLoad: {
        totalPowerW,
        dailyEnergyKWh,
        dailyEnergyWh: Math.round(dailyEnergyKWh * 1000),
        voltageAC: voltage,
        phaseAC: phase,
        currentA,
        surgePowerW,
      },
      environmentSnapshot: {
        ...environment,
        assessment: environmentAssessment,
        solarDefaults: envSolarDefaults,
      },
      methodSummary: methodSummaryByMethod[method] || {
        title: `چکیده مسیر ${METHOD_LABELS[method] || method}`,
        basis: sizingBasis,
        keyMetrics: { totalPowerW, dailyEnergyKWh, voltageAC: voltage, currentA, surgePowerW },
        nextStepHints: [],
      },
      routePayload: targetDomain === "utility" && method === "solar_panel_power" ? {
        ...routePayloadByMethod.solar_panel_power,
        type: "utility_solar_panel_power",
        utilityScaleBasis: "effective_after_losses",
        dedicatedSystemRoute: "/new-project/system/utility",
      } : routePayloadByMethod[method] || { type: method },
      autonomy: autonomySnapshot,
      systemHints: {
        domain: targetDomain,
        originalDomain: sourceDomain,
        needsPv: targetDomain !== "emergency",
        needsBattery: autonomySnapshot.required ? true : targetDomain === "solar" ? "depends_on_scenario" : false,
        batteryReason: autonomySnapshot.reason,
        needsInverter: true,
        preferredSystemType: targetDomain === "emergency" ? "battery_inverter_backup" : targetDomain === "utility" ? "utility_scale_pv" : localStorage.getItem("shil:solarSystemType") || "offgrid",
        sizingBasis,
        nextSystemRoute,
      },
      engineResult: finalResult,
    };
  };

  const toggleItem = (item) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else {
        next.add(item.id);
        setItemOverrides((old) => ({
          ...old,
          [item.id]: {
            quantity: old[item.id]?.quantity ?? 1,
            usageHoursPerDay: old[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
            hasSoftStarter: old[item.id]?.hasSoftStarter ?? false,
          },
        }));
      }
      return next;
    });
  };

  const patchOverride = (id, patch) => {
    setItemOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const applySmartDetails = () => {
    setShowExpert(true);
    setItemOverrides((prev) => {
      const next = { ...prev };
      consumerEquipmentLibrary.forEach((item) => {
        if (!selectedIds.has(item.id)) return;
        const isMotor = item.type === "inductive" || Number(item.startupFactor || item.surgeFactor || 1) > 1.7;
        next[item.id] = {
          ...(next[item.id] || {}),
          quantity: next[item.id]?.quantity ?? 1,
          usageHoursPerDay: next[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
          simultaneityFactor: next[item.id]?.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1,
          powerFactor: next[item.id]?.powerFactor ?? item.powerFactor ?? (isMotor ? 0.82 : 0.95),
          isMotor,
          hasSoftStarter: next[item.id]?.hasSoftStarter ?? false,
          loadKind: isMotor ? "motor" : "resistive/electronic",
        };
      });
      return next;
    });
  };

  const goToUtilityGateway = () => {
    startUtilityGateway("solar-panel-power-over-30kw");
    navigate("/new-project/system/utility?from=solar-panel-warning&gateway=utility");
  };

  const confirmLoad = () => {
    if (method === "solar_panel_power" && distributionMismatch) {
      setScaleWarning(`جمع پنل‌های تقسیم‌شده باید برابر ${panelCountNormalized} باشد. مقدار فعلی ${distributionTotal} است.`);
      return;
    }
    if (method === "solar_panel_power" && isUtilityPanelScale && !isUtilityRoute) {
      setScaleWarning("توان موثر پنل‌ها از 30kW عبور کرده است؛ خروجی این مرحله به صورت خودکار به تنظیمات نیروگاهی منتقل می‌شود.");
    }

    if (method !== "solar_panel_power") {
      localStorage.removeItem("shil:solarPanelPowerInput");
      localStorage.removeItem("shil:solarPanelPowerPreview");
    }

    if (method === "solar_panel_power") {
      localStorage.setItem("shil:solarPanelPowerInput", JSON.stringify({
        selectedPanelId,
        panelTitle: selectedPanel.title,
        panelPowerW: Number(panelPowerW || 0),
        panelCount: Number(panelCount || 0),
        totalPanelPowerW,
        psh: Number(psh || 0),
        lossPercent: Number(lossPercent || 0),
        effectiveEfficiencyPercent: Number((100 - toNumber(lossPercent, 0)).toFixed(1)),
        effectivePanelPowerW,
        environmentalSource: {
          city: environment?.city,
          peakSunHours: environment?.peakSunHours,
          soilingLossPercent: environment?.soilingLossPercent,
          thermalDeratePercent: environment?.thermalDeratePercent,
          defaults: envSolarDefaults,
        },
        rawDailyEnergyKWh: rawPvDailyKWh,
        generatedDailyKWh: calculatedPvDailyKWh,
        usableDailyEnergyKWh: calculatedPvDailyKWh,
        acVoltageRoute: toNumber(acVoltageRoute, 220),
        inverterSplitCount: inverterCountNormalized,
        inverterPanelDistribution: activePanelDistribution.map((value) => toNumber(value, 0)),
        manualPanelSplit: Boolean(showManualPanelSplit),
        isUtilityPanelScale,
        utilityScaleBasis: "effective_after_losses",
      }));
      localStorage.setItem("shil:solarPanelPowerPreview", JSON.stringify(solarPanelPreview));
      localStorage.setItem("shil:unifiedPvEngineResult:input", JSON.stringify(solarPanelPreview));
    }

    const result = persistLoadEngineResult({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: toNumber(method === "solar_panel_power" ? acVoltageRoute : method === "profile" ? profileVoltage : manualVoltage || 220, 220),
      phaseAC: toNumber(method === "solar_panel_power" ? acVoltageRoute : method === "profile" ? profileVoltage : manualVoltage || 220, 220) >= 380 ? "three" : "single",
      manualEnergyWh: method === "energy" && manualEnergyKWh ? toNumber(manualEnergyKWh, 0) * 1000 : method === "profile" ? profileTotalEnergyWh : method === "solar_panel_power" ? calculatedPvDailyKWh * 1000 : 0,
      manualPowerW: method === "current" && manualCurrentA ? Math.round(toNumber(manualCurrentA, 0) * toNumber(manualVoltage || 220, 220) * (toNumber(manualVoltage || 220, 220) >= 380 ? Math.sqrt(3) : 1)) : method === "profile" ? profilePeakPowerW : method === "solar_panel_power" ? totalPanelPowerW : toNumber(manualPowerW, 0),
      manualSurgeW: method === "profile" ? profileSurgePowerW : 0,
      manualHours: toNumber(method === "solar_panel_power" ? psh || 0 : method === "profile" ? 1 : manualHours || 0, 0),
      loadProfile: method === "profile" ? profileLoadProfile : undefined,
    });

    if (method === "profile") {
      localStorage.setItem("shil:profileConsumptionInput", JSON.stringify({
        voltageAC: toNumber(profileVoltage, 220),
        basePowerW: toNumber(profilePowerW, 0),
        startFactor: toNumber(profileStartFactor, 1.6),
        bucketsWh: profileBucketsWh,
        totalEnergyWh: profileTotalEnergyWh,
        peakPowerW: profilePeakPowerW,
        surgePowerW: profileSurgePowerW,
      }));
    }

    const finalResult = method === "equipment" ? {
      ...result,
      selectedItems,
      selectedCount: equipmentStats.selectedCount || result.selectedCount || selectedItems.length,
      totalPowerW: equipmentStats.totalPowerW || result.totalPowerW,
      totalEnergyKWh: equipmentStats.totalEnergyKWh || result.totalEnergyKWh,
      acCurrentA: equipmentStats.acCurrentA || result.acCurrentA,
      startCurrentA: equipmentStats.startCurrentA || result.startCurrentA,
      surgePowerW: equipmentStats.surgePowerW || result.surgePowerW,
      motorCount: equipmentStats.motorCount,
      softStarterCount: equipmentStats.softStarterCount,
      equipmentStats,
    } : result;
    localStorage.setItem("shil:loadEngineResult", JSON.stringify(finalResult));
    const systemSetupHandoff = buildSystemSetupHandoff(finalResult);
    localStorage.setItem("shil:systemSetupHandoff", JSON.stringify(systemSetupHandoff));
    localStorage.setItem(`shil:systemSetupHandoff:${domain}:${method}`, JSON.stringify(systemSetupHandoff));
    if (method === "equipment") {
      localStorage.setItem("shil:selectedEquipmentItems", JSON.stringify(selectedItems));
      localStorage.setItem("shil:equipmentCalculationStats", JSON.stringify(equipmentStats));
    }
    buildScenarioCalculationInput();
    if (isReadyScenarioEquipmentFlow) {
      localStorage.setItem("shil:scenarioEquipmentConfirmed", "true");
      localStorage.setItem("shil:scenarioNextStep", "system-settings");
      localStorage.setItem("shil:scenarioEquipmentBranch", domain);
    }
    const nextDomain = systemSetupHandoff?.systemHints?.domain || effectiveDomain;
    navigate(`/new-project/system/${nextDomain}?from=calculation-inputs${isReadyScenarioEquipmentFlow ? "&scenarioFlow=1" : ""}`);
  };

  const inputConfirmSlotRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const slot = inputConfirmSlotRef.current;
    if (!slot) return undefined;

    let frame = 0;
    let observer = null;

    const placeAfterLastVisibleData = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = inputConfirmSlotRef.current;
        if (!current) return;

        // Measure from the natural document-flow position, then add only the
        // amount needed to clear any visually overflowing content plus 8px.
        current.style.marginTop = "0px";
        const previous = current.previousElementSibling;
        const currentRect = current.getBoundingClientRect();
        const previousRect = previous?.getBoundingClientRect();
        const overlap = previousRect ? Math.max(0, previousRect.bottom - currentRect.top) : 0;
        current.style.marginTop = `${overlap + 8}px`;
      });
    };

    placeAfterLastVisibleData();
    window.addEventListener("resize", placeAfterLastVisibleData);

    const previous = slot.previousElementSibling;
    if (previous && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(placeAfterLastVisibleData);
      observer.observe(previous);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", placeAfterLastVisibleData);
      observer?.disconnect();
    };
  }, [method, forceAutonomyBattery, autonomyHours, autonomyDays, scaleWarning]);

  return (
    <ShilPageShell title="ورودی محاسبات">
      <ProjectMiniRail />
      <div id="shil-calculation-inputs-root" className="shil-equipment-page shil-calculation-inputs-page">
        <section className="shil-env-card">
          <h3 className="shil-section-title">زمینه محاسبات</h3>
          {isReadyScenarioEquipmentFlow ? (
            <p className="shil-muted-note">{domain === "emergency" ? "سناریوی آماده برق اضطراری" : "سناریوی آماده خورشیدی"} بعد از تأیید شرایط محیطی وارد این لیست شده است. تجهیزات پیشنهادی سناریو از قبل انتخاب شده‌اند؛ می‌توانی حذف، اضافه یا تعداد و ساعت مصرف را اصلاح کنی و بعد مسیر اصلی پروژه با موتور محاسباتی همان شاخه ادامه پیدا می‌کند.</p>
          ) : null}
          <div className="shil-summary-grid">
            <div><span>روش</span><strong>{contextMethodLabel}</strong></div>
            <div><span>هسته</span><strong>{effectiveDomain === "utility" ? "نیروگاهی" : effectiveDomain === "emergency" ? "برق اضطراری" : "خورشیدی"}</strong></div>
            <div><span>سناریو</span><strong>{contextScenarioLabel}</strong></div>
            <div><span>شهر</span><strong>{contextCityLabel}</strong></div>
          </div>
        </section>

        {method === "equipment" ? (
          <section className="shil-env-card shil-equipment-picker-card">
            <h3 className="shil-section-title">لیست تجهیزات شما را مشخص کنید</h3>
            <button type="button" className="shil-equipment-field" onClick={() => setIsEquipmentPickerOpen((v) => !v)}>
              <span>{isReadyScenarioEquipmentFlow ? "اصلاح تجهیزات سناریوی انتخابی" : "انتخاب از بانک 250 تجهیز"}</span>
              <strong>{selectedItems.length ? `${selectedItems.length} تجهیز انتخاب شده` : "باز کردن لیست"}</strong>
            </button>

            {isEquipmentPickerOpen ? (
              <div className="shil-equipment-picker-panel">
                <input
                  className="shil-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو: پمپ، روشنایی، کولر، سرور..."
                />
                <div className="shil-equipment-scroll-list">
                  {items.map((item) => {
                    const selected = selectedIds.has(item.id);
                    const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`shil-equipment-option ${selected ? "active" : ""}`}
                        onClick={() => toggleItem(item)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.ratedPowerW}W · {item.usageHoursPerDay}h · {isMotor ? "موتوری" : "مصرفی"}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="shil-secondary-wide" onClick={() => setIsEquipmentPickerOpen(false)}>
                  بستن لیست تجهیزات
                </button>
              </div>
            ) : null}

            <div className="shil-equipment-actions">
              <button type="button" className="shil-secondary-wide" onClick={applySmartDetails}>
                اعمال هوشمند
              </button>
              <button type="button" className="shil-secondary-wide" onClick={() => setShowExpert((v) => !v)}>
                {showExpert ? "خلاصه ساده" : "نمایش جزئیات تخصصی"}
              </button>
            </div>

            <p className="shil-muted-note">انتخاب تجهیزات فقط داخل همین فیلد انجام می‌شود؛ با جستجو یا اسکرول انتخاب کن، سپس لیست را ببند و تجهیزات انتخابی را اصلاح کن.</p>
          </section>
        ) : null}

        {method !== "equipment" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">اطلاعات مورد نیاز را وارد کنید.</h3>
            {method === "profile" ? (
              <>
                <div className="shil-form-grid">
                  <label>توان همزمان/پیک مصرف W<input className="shil-input" value={profilePowerW} onChange={(e) => setProfilePowerW(e.target.value)} placeholder="مثلاً 3500" inputMode="numeric" /></label>
                  <label>ولتاژ AC<select className="shil-input" value={profileVoltage} onChange={(e) => setProfileVoltage(e.target.value)}><option value="220">220 ولت تک‌فاز</option><option value="380">380 ولت سه‌فاز</option></select></label>
                  <label>ضریب راه‌اندازی/پیک<input className="shil-input" value={profileStartFactor} onChange={(e) => setProfileStartFactor(e.target.value)} placeholder="مثلاً 1.6" inputMode="decimal" /></label>
                  <label>مصرف صبح kWh<input className="shil-input" value={profileMorningKWh} onChange={(e) => setProfileMorningKWh(e.target.value)} inputMode="decimal" /></label>
                  <label>مصرف ظهر kWh<input className="shil-input" value={profileNoonKWh} onChange={(e) => setProfileNoonKWh(e.target.value)} inputMode="decimal" /></label>
                  <label>مصرف عصر kWh<input className="shil-input" value={profileEveningKWh} onChange={(e) => setProfileEveningKWh(e.target.value)} inputMode="decimal" /></label>
                  <label>مصرف شب kWh<input className="shil-input" value={profileNightKWh} onChange={(e) => setProfileNightKWh(e.target.value)} inputMode="decimal" /></label>
                </div>
                <div className="shil-summary-grid">
                  <div><span>مصرف کل روزانه</span><strong>{(profileTotalEnergyWh / 1000).toFixed(2)} kWh</strong></div>
                  <div><span>توان پیک مبنا</span><strong>{Math.round(profilePeakPowerW)} W</strong></div>
                  <div><span>توان راه‌اندازی</span><strong>{profileSurgePowerW} W</strong></div>
                  <div><span>بازه پیک مصرف</span><strong>{profileLoadProfile.peakBucket === "night" ? "شب" : profileLoadProfile.peakBucket === "noon" ? "ظهر" : profileLoadProfile.peakBucket === "morning" ? "صبح" : "عصر"}</strong></div>
                </div>
                <p className="shil-muted-note">این مسیر فقط بر اساس الگوی مصرف روزانه کار می‌کند و بانک پنل، MPPT و تقسیم پنل در آن نمایش داده نمی‌شود.</p>
              </>
            ) : method === "solar_panel_power" ? (
              <>
                <div className="shil-form-grid">
                  <label>بانک کامل پنل خورشیدی<select className="shil-input" value={selectedPanelId} onChange={(e) => setSelectedPanelId(e.target.value)}>{SHIL_SOLAR_PANELS.map((panel) => <option key={panel.id} value={panel.id}>{panel.title} / {panel.powerW}W / {panel.type}</option>)}</select></label>
                  <label>توان هر پنل W<input className="shil-input" value={panelPowerW} readOnly /></label>
                  <label>تعداد پنل<input className="shil-input" value={panelCount} onChange={(e) => setPanelCount(e.target.value)} placeholder="مثلاً 24" inputMode="numeric" /></label>
                  <label>ساعات آفتاب مؤثر PSH<input className="shil-input" value={psh} onChange={(e) => setPsh(e.target.value)} placeholder={`از شرایط محیطی: ${envSolarDefaults.psh}`} inputMode="decimal" /></label>
                  <label>تلفات کل سیستم ٪<input className="shil-input" value={lossPercent} onChange={(e) => setLossPercent(e.target.value)} placeholder={`از شرایط محیطی: ${envSolarDefaults.totalLoss}%`} inputMode="decimal" /></label>
                  <label>راندمان مؤثر سیستم ٪<input className="shil-input" value={(100 - toNumber(lossPercent, 0)).toFixed(1)} onChange={(e) => { const efficiency = Math.max(5, Math.min(100, toNumber(e.target.value, 0))); setLossPercent(String((100 - efficiency).toFixed(1))); }} placeholder="محاسبه از شرایط محیطی" inputMode="decimal" /></label>
                  <label>مسیر خروجی AC<select className="shil-input" value={acVoltageRoute} onChange={(e) => setAcVoltageRoute(e.target.value)}><option value="220">220 ولت تک‌فاز</option><option value="380">380 ولت سه‌فاز</option></select></label>
                </div>
                <h3 className="shil-section-title">نتایج توان پنل خورشیدی</h3>
                <div className="shil-summary-grid">
                  <div><span>توان کل پنل‌ها</span><strong>{(totalPanelPowerW / 1000).toFixed(2)} kW</strong></div>
                  <div><span>تولید روزانه بدون تلفات</span><strong>{rawPvDailyKWh} kWh</strong></div>
                  <div><span>منبع PSH و تلفات</span><strong>{contextCityLabel}</strong></div>
                  <div><span>راندمان مؤثر</span><strong>{(100 - toNumber(lossPercent, 0)).toFixed(1)}٪</strong></div>
                  <div><span>جهت و زاویه مطابق شرایط محیطی</span><strong>{envSolarDefaults.orientation.toFixed(1)}٪</strong></div>
                </div>
                <ShilWarningOverlay messages={isUtilityPanelScale && !isUtilityRoute ? [<strong key="utility-scale">توان موثر بالای 30kW است؛ ادامه این ورودی در صفحه تنظیمات نیروگاهی انجام می‌شود.</strong>] : []} />
              </>
            ) : (
              <div className="shil-form-grid">
                {method === "energy" ? <label>انرژی روزانه kWh<input className="shil-input" value={manualEnergyKWh} onChange={(e) => setManualEnergyKWh(e.target.value)} placeholder="مثلاً 12.5" inputMode="decimal" /></label> : null}
                {method === "power" ? <label>توان مدنظر پروژه W<input className="shil-input" value={manualPowerW} onChange={(e) => setManualPowerW(e.target.value)} placeholder="مثلاً 3500" inputMode="numeric" /></label> : null}
                {method === "current" ? <label>جریان کل A<input className="shil-input" value={manualCurrentA} onChange={(e) => setManualCurrentA(e.target.value)} placeholder="مثلاً 16" inputMode="decimal" /></label> : null}
                {(method === "power" || method === "current") ? (
                  <label>ولتاژ شبکه<select className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)}><option value="220">220 ولت تک‌فاز</option><option value="380">380 ولت سه‌فاز</option></select></label>
                ) : (
                  <label>ولتاژ AC<input className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)} inputMode="numeric" /></label>
                )}
                {method !== "power" && method !== "current" ? <label>ساعت استفاده / زمان برق اضطراری مورد نظر<input className="shil-input" value={manualHours} onChange={(e) => setManualHours(e.target.value)} inputMode="decimal" /></label> : null}
              </div>
            )}
          </section>
        ) : null}

        {method !== "solar_panel_power" && method !== "equipment" ? (
        <section className="shil-env-card">
          <h3 className="shil-section-title">
            {methodResultTitle}
          </h3>
          <div className="shil-summary-grid">
            {method === "equipment" ? <div><span>تجهیزات انتخاب‌شده</span><strong>{selectedEquipmentTitles || "ثبت نشده"}</strong></div> : null}
            {method !== "power" && method !== "current" ? <div><span>تعداد تجهیزات</span><strong>{enginePreview.selectedCount || "Auto"}</strong></div> : null}
            {method !== "current" ? <div><span>توان کل</span><strong>{enginePreview.totalPowerW} W</strong></div> : null}
            {method !== "current" ? <div><span>انرژی روزانه</span><strong>{enginePreview.totalEnergyKWh} kWh</strong></div> : null}
            {method === "current" ? <div><span>جریان کل واردشده</span><strong>{toNumber(manualCurrentA, 0)} A</strong></div> : <div><span>جریان AC</span><strong>{enginePreview.acCurrentA} A</strong></div>}
            {method === "current" ? <div><span>ولتاژ شبکه</span><strong>{manualPhaseLabel}</strong></div> : null}
            {method === "current" ? <div><span>توان محاسبه‌شده</span><strong>{currentDerivedPowerW} W</strong></div> : null}
            {method !== "power" && method !== "current" ? <div><span>جریان راه‌اندازی</span><strong>{enginePreview.startCurrentA} A</strong></div> : null}
            {method !== "power" && method !== "current" ? <div><span>پیک استارت</span><strong>{enginePreview.surgePowerW} W</strong></div> : null}
            {method !== "power" && method !== "current" ? <div><span>موتوری/سافت</span><strong>{enginePreview.motorCount || 0}/{enginePreview.softStarterCount || 0}</strong></div> : null}
          </div>
          {showExpert && method !== "power" && method !== "current" ? (
            <div className="shil-expert-box">
              <strong>منطق پشت پرده:</strong>
              <p>{enginePreview.expertSummary?.rule}</p>
              <p>{enginePreview.expertSummary?.motorStartRule}</p>
            </div>
          ) : null}
          {enginePreview.warnings?.length ? (
            <ul className="shil-warning-list">
              {enginePreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </section>
        ) : null}

        {method === "profile" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">جزئیات نتایج پروفایل مصرف</h3>
            <div className="shil-summary-grid">
              <div><span>صبح</span><strong>{Math.round(safeLoadBuckets.morning / 1000)} kWh</strong></div>
              <div><span>ظهر</span><strong>{Math.round(safeLoadBuckets.noon / 1000)} kWh</strong></div>
              <div><span>عصر</span><strong>{Math.round(safeLoadBuckets.evening / 1000)} kWh</strong></div>
              <div><span>شب</span><strong>{Math.round(safeLoadBuckets.night / 1000)} kWh</strong></div>
            </div>
          </section>
        ) : null}

        {method === "equipment" ? (
          <section className="shil-selected-equipment-list">
            <h3 className="shil-section-title">تجهیزات انتخابی</h3>
            {!selectedItems.length ? (
              <div className="shil-empty-selection">هنوز تجهیزی انتخاب نشده است.</div>
            ) : selectedItems.map((item) => {
              const override = itemOverrides[item.id] || {};
              const preview = enginePreview.selectedItems?.find((x) => x.id === item.id);
              const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
              return (
                <article key={item.id} className="shil-equipment-card active">
                  <div className="shil-selected-equipment-head">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category} | {isMotor ? "موتوری" : "مقاومتی/الکترونیکی"}{override.scenarioSeeded ? " | پیشنهاد سناریو" : ""}</span>
                    </div>
                    <button type="button" className="shil-remove-equipment" onClick={() => toggleItem(item)}>حذف</button>
                  </div>
                  <div className="shil-equipment-controls">
                    <label>تعداد<input className="shil-input" value={override.quantity ?? item.quantity ?? 1} onChange={(e) => patchOverride(item.id, { quantity: e.target.value })} inputMode="numeric" /></label>
                    <label>ساعت مصرف<input className="shil-input" value={override.usageHoursPerDay ?? item.usageHoursPerDay} onChange={(e) => patchOverride(item.id, { usageHoursPerDay: e.target.value })} inputMode="decimal" /></label>
                    {showExpert ? (
                      <>
                        <label>ضریب همزمانی<input className="shil-input" value={override.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1} onChange={(e) => patchOverride(item.id, { simultaneityFactor: e.target.value })} inputMode="decimal" /></label>
                        <label>راندمان/PF<input className="shil-input" value={override.powerFactor ?? item.powerFactor ?? 0.95} onChange={(e) => patchOverride(item.id, { powerFactor: e.target.value })} inputMode="decimal" /></label>
                      </>
                    ) : null}
                    {isMotor ? (
                      <label className="shil-check-row">
                        <input type="checkbox" checked={Boolean(override.hasSoftStarter)} onChange={(e) => patchOverride(item.id, { hasSoftStarter: e.target.checked })} />
                        سافت‌استارتر دارد؛ جریان راه‌اندازی از 2.5× به 1.2× جریان نامی کاهش یابد
                      </label>
                    ) : showExpert ? (
                      <div className="shil-load-kind-note">نوع بار: مقاومتی/الکترونیکی</div>
                    ) : null}
                    {showExpert && preview ? (
                      <div className="shil-expert-mini">
                        <span>جریان نامی: {preview.nominalCurrentA} A</span>
                        <span>جریان کارکرد: {preview.runningCurrentA} A</span>
                        <span>جریان راه‌اندازی: {preview.startCurrentA} A</span>
                        <span>ضریب استارت: ×{preview.currentStartFactor}</span>
                        <small>{preview.expertReason}</small>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {method === "equipment" ? (
          <section className="shil-env-card shil-equipment-results-card">
            <h3 className="shil-section-title">نتایج لیست تجهیزات</h3>
            <div className="shil-summary-grid">
              <div><span>تعداد تجهیزات انتخاب‌شده</span><strong>{enValue(equipmentStats.selectedCount || enginePreview.selectedCount, "تجهیز")}</strong></div>
              <div><span>تجهیزات موتوری</span><strong>{enValue(equipmentStats.motorCount, "تجهیز")}</strong></div>
              <div><span>تجهیزات دارای سافت‌استارتر</span><strong>{enValue(equipmentStats.softStarterCount, "تجهیز")}</strong></div>
              <div><span>توان کل</span><strong>{enValue(equipmentStats.totalPowerW || enginePreview.totalPowerW, "W")}</strong></div>
              <div><span>انرژی روزانه</span><strong>{enValue(equipmentStats.totalEnergyKWh || enginePreview.totalEnergyKWh, "kWh", 2)}</strong></div>
              <div><span>جریان AC</span><strong>{enValue(equipmentStats.acCurrentA || enginePreview.acCurrentA, "A", 2)}</strong></div>
              <div><span>جریان راه‌اندازی</span><strong>{enValue(equipmentStats.startCurrentA || enginePreview.startCurrentA, "A", 2)}</strong></div>
              <div><span>پیک توان / پیک استارت</span><strong>{enValue(equipmentStats.surgePowerW || enginePreview.surgePowerW, "W")}</strong></div>
            </div>
            {selectedItems.length ? (
              <p className="shil-muted-note">اعداد این بلوک از تجهیزات انتخاب‌شده، تعداد، ساعت مصرف، ضریب همزمانی، نوع بار موتوری و وضعیت سافت‌استارتر محاسبه شده‌اند.</p>
            ) : (
              <div className="shil-empty-selection">برای محاسبه نتایج، ابتدا حداقل یک تجهیز انتخاب کنید.</div>
            )}
          </section>
        ) : null}


        {effectiveDomain !== "utility" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">خودکفایی و الزام باتری</h3>
            <div className="shil-form-grid">
              <label>ساعت خودکفایی / بکاپ<input className="shil-input" value={autonomyHours} onChange={(e) => setAutonomyHours(e.target.value)} placeholder={effectiveDomain === "emergency" ? "مثلاً 6" : "اختیاری"} inputMode="decimal" /></label>
              <label>روز خودکفایی<input className="shil-input" value={autonomyDays} onChange={(e) => setAutonomyDays(e.target.value)} placeholder="مثلاً 1" inputMode="decimal" /></label>
              <label className="shil-check-row">
                <input type="checkbox" checked={forceAutonomyBattery} onChange={(e) => setForceAutonomyBattery(e.target.checked)} />
                باتری در طراحی سیستم الزام شود
              </label>
            </div>
            <p className="shil-muted-note">
              {autonomySnapshot.required ? `باتری الزامی است؛ دلیل: ${autonomySnapshot.reason === "emergency_backup_required" ? "مسیر برق اضطراری" : autonomySnapshot.reason === "autonomy_required" ? "ثبت زمان خودکفایی" : "درخواست کاربر"}. زمان مبنا: ${autonomySnapshot.hours} ساعت.` : "اگر ساعت یا روز خودکفایی وارد شود، صفحه تنظیمات باتری را اجباری در نظر می‌گیرد."}
            </p>
          </section>
        ) : (
          <section className="shil-env-card">
            <h3 className="shil-section-title">مسیر اختصاصی نیروگاهی</h3>
            <p className="shil-muted-note">این ورودی با دامنه نیروگاهی به صفحه تنظیمات منتقل می‌شود و درگیر ظاهر یا منطق مسیر خورشیدی مصرف‌محور نمی‌شود.</p>
          </section>
        )}
        <ShilWarningOverlay messages={scaleWarning ? [scaleWarning] : []} />
        <div
          ref={inputConfirmSlotRef}
          className="shil-input-content-confirm-slot"
          aria-label="تأیید ورودی محاسبات"
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            margin: "8px 0px calc(52px + env(safe-area-inset-bottom, 0px))",
            padding: 0,
            minHeight: 0,
            height: "auto",
            background: "transparent",
            border: "0",
            boxShadow: "none",
            transform: "none",
            clear: "both",
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <ShilPrimaryButton
            className="shil-env-content-confirm-button"
            onClick={confirmLoad}
            label="تأیید توان"
            style={{
              position: "static",
              left: "auto",
              right: "auto",
              bottom: "auto",
              top: "auto",
              transform: "none",
              width: "max-content",
              minWidth: 0,
              maxWidth: "none",
              padding: "0 12px",
              whiteSpace: "nowrap",
            }}
          />
        </div>
      </div>
    </ShilPageShell>
  );
}
