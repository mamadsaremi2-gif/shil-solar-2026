import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import { consumerEquipmentLibrary, searchConsumerEquipment } from "../../data/catalogs/consumerEquipmentLibrary.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { METHOD_LABELS, persistLoadEngineResult, runLoadEngine } from "../../core/calculation/loadEngine.js";
import { runSolarPanelPowerEngine } from "../../core/calculation/solarPanelPowerEngine.js";
import { SHIL_SOLAR_PANELS, SHIL_LITHIUM_BATTERIES } from "../../data/shilSolarBanks.js";
import { isScenarioFlowFor, startUtilityGateway } from "../../workflow/flowIsolation.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function normalizePersianInput(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
    .replace(/,/g, "")
    .trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(normalizePersianInput(value));
  return Number.isFinite(n) ? n : fallback;
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
  const domain = params.domain || localStorage.getItem("shil:scenarioDomain") || "solar";
  const method = params.method || localStorage.getItem("shil:calculationMethod") || "equipment";

  const [query, setQuery] = useState("");
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [scaleWarning, setScaleWarning] = useState("");
  const scenario = useMemo(() => readDraft("shil:selectedScenario"), []);
  const scenarioSeededItems = useMemo(() => matchScenarioEquipmentItems(scenario), [scenario]);
  const isReadyScenarioEquipmentFlow = isScenarioFlowFor(domain) && method === "equipment" && ["solar", "emergency"].includes(domain);

  const [selectedIds, setSelectedIds] = useState(() => new Set(isReadyScenarioEquipmentFlow ? scenarioSeededItems.map((item) => item.id) : []));
  const [itemOverrides, setItemOverrides] = useState(() => isReadyScenarioEquipmentFlow ? buildScenarioEquipmentOverrides(scenario, scenarioSeededItems) : {});
  const [showExpert, setShowExpert] = useState(false);
  const [manualEnergyKWh, setManualEnergyKWh] = useState("");
  const [manualPowerW, setManualPowerW] = useState("");
  const [manualCurrentA, setManualCurrentA] = useState("");
  const [manualVoltage, setManualVoltage] = useState(domain === "emergency" ? "220" : "220");
  const [manualHours, setManualHours] = useState(domain === "emergency" ? "6" : "5");

  const environment = useMemo(() => readDraft("shil:environmentDraft") || {}, []);
  const environmentAssessment = useMemo(() => readDraft("shil:environmentAssessment") || {}, []);
  const envSolarDefaults = useMemo(() => getEnvironmentSolarDefaults(environment, environmentAssessment), [environment, environmentAssessment]);

  const defaultPanel = SHIL_SOLAR_PANELS.find((p) => p.powerW === 620) || SHIL_SOLAR_PANELS[0];
  const defaultBattery = SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200) || SHIL_LITHIUM_BATTERIES[0];
  const [selectedPanelId, setSelectedPanelId] = useState(defaultPanel?.id || "");
  const [panelCount, setPanelCount] = useState("10");
  const [psh, setPsh] = useState(String(envSolarDefaults.psh));
  const [lossPercent, setLossPercent] = useState(String(envSolarDefaults.totalLoss));
  const [dailyLoadKWh, setDailyLoadKWh] = useState("");
  const [acVoltageRoute, setAcVoltageRoute] = useState("220");
  const [inverterSplitCount, setInverterSplitCount] = useState("1");
  const [needsBattery, setNeedsBattery] = useState(false);
  const [daysAutonomy, setDaysAutonomy] = useState("1");
  const [batteryId, setBatteryId] = useState(defaultBattery?.id || "");
  const [batteryDod, setBatteryDod] = useState(String(defaultBattery?.usableDod || 0.85));
  const [systemEta, setSystemEta] = useState(String(defaultBattery?.efficiency || 0.94));

  const items = useMemo(() => {
    const results = searchConsumerEquipment(query);
    return results.slice(0, 250);
  }, [query]);

  const selectedItems = useMemo(() => {
    return consumerEquipmentLibrary
      .filter((item) => selectedIds.has(item.id))
      .map((item) => mergeItemWithOverride(item, itemOverrides[item.id]));
  }, [selectedIds, itemOverrides]);

  const selectedPanel = useMemo(() => SHIL_SOLAR_PANELS.find((item) => item.id === selectedPanelId) || defaultPanel || {}, [selectedPanelId, defaultPanel]);
  const selectedBattery = useMemo(() => SHIL_LITHIUM_BATTERIES.find((item) => item.id === batteryId) || defaultBattery || {}, [batteryId, defaultBattery]);
  const panelPowerW = toNumber(selectedPanel.powerW, 0);
  const batteryUnitKWh = toNumber(selectedBattery.energyWh || (toNumber(selectedBattery.nominalVoltage, 0) * toNumber(selectedBattery.capacityAh, 0)), 0) / 1000;
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
  const isUtilityGateway = domain === "utility";

  const defaultPanelDistribution = useMemo(() => {
    const invCount = Math.max(1, Math.round(toNumber(inverterSplitCount, 1)));
    const total = Math.max(0, Math.round(toNumber(panelCount, 0)));
    const base = Math.floor(total / invCount);
    const rest = total % invCount;
    return Array.from({ length: invCount }, (_, index) => base + (index < rest ? 1 : 0));
  }, [panelCount, inverterSplitCount]);

  const [showManualPanelSplit, setShowManualPanelSplit] = useState(false);
  const [manualPanelDistribution, setManualPanelDistribution] = useState([]);

  useEffect(() => {
    setManualPanelDistribution((prev) => {
      const invCount = Math.max(1, Math.round(toNumber(inverterSplitCount, 1)));
      const next = Array.from({ length: invCount }, (_, index) => toNumber(prev[index] ?? defaultPanelDistribution[index] ?? 0, 0));
      return next;
    });
  }, [inverterSplitCount, defaultPanelDistribution]);

  const activePanelDistribution = showManualPanelSplit ? manualPanelDistribution : defaultPanelDistribution;
  const distributionTotal = activePanelDistribution.reduce((sum, value) => sum + toNumber(value, 0), 0);
  const distributionMismatch = showManualPanelSplit && distributionTotal !== panelCountNormalized;

  const inverterPanelLayouts = useMemo(() => {
    return activePanelDistribution.map((panelQty, index) => {
      const count = Math.max(0, Math.round(toNumber(panelQty, 0)));
      const series = count > 0 ? Math.max(1, Math.min(count, Math.round(Math.sqrt(count)))) : 0;
      const parallel = count > 0 ? Math.ceil(count / Math.max(1, series)) : 0;
      const powerKW = Number(((count * panelPowerW) / 1000).toFixed(2));
      return { index: index + 1, count, series, parallel, powerKW };
    });
  }, [activePanelDistribution, panelPowerW]);


  const enginePreview = useMemo(() => {
    const voltage = toNumber(method === "solar_panel_power" ? acVoltageRoute : manualVoltage || 220, 220);
    const powerFromCurrent = method === "current" && manualCurrentA ? toNumber(manualCurrentA, 0) * voltage : 0;
    const energyFromManual = method === "energy" && manualEnergyKWh ? toNumber(manualEnergyKWh, 0) * 1000 : 0;
    const powerFromManual = method === "power" && manualPowerW ? toNumber(manualPowerW, 0) : 0;
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
      manualHours: toNumber(manualHours || psh || 0, 0),
    });
  }, [domain, method, scenario, environment, environmentAssessment, selectedItems, manualEnergyKWh, manualPowerW, manualCurrentA, manualVoltage, manualHours, panelPowerW, panelCount, psh, acVoltageRoute, totalPanelPowerW, calculatedPvDailyKWh]);

  const solarPanelPreview = useMemo(() => {
    if (method !== "solar_panel_power") return null;
    const count = Math.max(0, Math.round(toNumber(panelCount, 0)));
    const pwr = toNumber(panelPowerW, 0);
    const seriesCount = count > 0 ? Math.max(1, Math.min(count, Math.round(Math.sqrt(count)))) : 1;
    const parallelCount = count > 0 ? Math.ceil(count / seriesCount) : 1;
    const lossRatio = Math.min(0.95, Math.max(0, toNumber(lossPercent, 0) / 100));
    const generatedDailyKWh = calculatedPvDailyKWh;
    return {
      ...runSolarPanelPowerEngine({
        panel: { powerW: pwr, voc: selectedPanel.voc || 49.5, vmp: selectedPanel.vmp || 41.5, imp: selectedPanel.imp || (pwr > 0 ? pwr / 41.5 : 0), isc: selectedPanel.isc || (pwr > 0 ? (pwr / 41.5) * 1.08 : 0), areaM2: selectedPanel.areaM2 || 2.6, type: selectedPanel.type },
        pvArray: { panelCount: count, seriesCount, parallelCount },
        env: { psh: toNumber(psh, 0), effectiveEfficiency: 1 - lossRatio, minTempC: environmentAssessment?.minTempC ?? -5, maxTempC: environmentAssessment?.maxTempC ?? 45 },
        load: { totalEnergyWh: generatedDailyKWh * 1000 },
        solarSizing: { input: { P_panel: pwr, N_panel: count, PSH: toNumber(psh, 0), lossRatio } },
      }),
      generatedDailyKWh,
      usableDailyEnergyKWh: generatedDailyKWh,
      acVoltageRoute: toNumber(acVoltageRoute, 220),
      inverterSplitCount: inverterCountNormalized,
      inverterPanelDistribution: activePanelDistribution.map((value) => toNumber(value, 0)),
      totalUsableAcPowerKW: Number((totalPanelPowerW / 1000).toFixed(2)),
      inverterPowerShareKW: Number(((totalPanelPowerW / 1000) / inverterCountNormalized).toFixed(2)),
      effectivePanelPowerW,
      isUtilityPanelScale,
      utilityScaleBasis: "effective_after_losses",
    };
  }, [method, panelPowerW, panelCount, psh, lossPercent, environmentAssessment, selectedPanel, acVoltageRoute, inverterSplitCount, totalPanelPowerW, effectivePanelPowerW, isUtilityPanelScale, calculatedPvDailyKWh, inverterCountNormalized, activePanelDistribution]);

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
    if (method === "solar_panel_power" && isUtilityPanelScale && !isUtilityGateway) {
      setScaleWarning("توان پنل‌های واردشده از ۳۰kW عبور کرده است. برای جلوگیری از شلوغی و خطای مسیر، ادامه طراحی باید از درگاه مستقل نیروگاهی انجام شود.");
      return;
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
    }

    const result = persistLoadEngineResult({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: toNumber(method === "solar_panel_power" ? acVoltageRoute : manualVoltage || 220, 220),
      phaseAC: toNumber(method === "solar_panel_power" ? acVoltageRoute : manualVoltage || 220, 220) >= 380 ? "three" : "single",
      manualEnergyWh: method === "energy" && manualEnergyKWh ? toNumber(manualEnergyKWh, 0) * 1000 : method === "solar_panel_power" ? calculatedPvDailyKWh * 1000 : 0,
      manualPowerW: method === "current" && manualCurrentA ? toNumber(manualCurrentA, 0) * toNumber(manualVoltage || 220, 220) : method === "solar_panel_power" ? totalPanelPowerW : toNumber(manualPowerW, 0),
      manualHours: toNumber(method === "solar_panel_power" ? psh || 0 : manualHours || 0, 0),
    });

    localStorage.setItem("shil:loadEngineResult", JSON.stringify(result));
    buildScenarioCalculationInput();
    if (isReadyScenarioEquipmentFlow) {
      localStorage.setItem("shil:scenarioEquipmentConfirmed", "true");
      localStorage.setItem("shil:scenarioNextStep", "system-settings");
      localStorage.setItem("shil:scenarioEquipmentBranch", domain);
    }
    navigate(`/new-project/system/${domain}?from=calculation-inputs${isReadyScenarioEquipmentFlow ? "&scenarioFlow=1" : ""}`);
  };

  return (
    <ShilPageShell title={METHOD_LABELS[method] || "ورودی محاسبات"}>
      <ProjectMiniRail />
      <div className="shil-equipment-page">
        <section className="shil-env-card">
          <h3 className="shil-section-title">زمینه محاسبات</h3>
          {isReadyScenarioEquipmentFlow ? (
            <p className="shil-muted-note">{domain === "emergency" ? "سناریوی آماده برق اضطراری" : "سناریوی آماده خورشیدی"} بعد از تأیید شرایط محیطی وارد این لیست شده است. تجهیزات پیشنهادی سناریو از قبل انتخاب شده‌اند؛ می‌توانی حذف، اضافه یا تعداد و ساعت مصرف را اصلاح کنی و بعد مسیر اصلی پروژه با موتور محاسباتی همان شاخه ادامه پیدا می‌کند.</p>
          ) : null}
          <div className="shil-summary-grid">
            <div><span>روش</span><strong>{METHOD_LABELS[method] || method}</strong></div>
            <div><span>هسته</span><strong>{domain === "emergency" ? "برق اضطراری" : "خورشیدی"}</strong></div>
            <div><span>سناریو</span><strong>{scenario?.title || "دستی"}</strong></div>
            <div><span>شهر</span><strong>{environment?.city || "اصفهان"}</strong></div>
          </div>
        </section>

        {method === "equipment" || method === "profile" ? (
          <section className="shil-env-card shil-equipment-picker-card">
            <h3 className="shil-section-title">{isReadyScenarioEquipmentFlow ? (domain === "emergency" ? "لیست تجهیزات سناریوی آماده برق اضطراری" : "لیست تجهیزات سناریوی آماده خورشیدی") : "لیست تجهیزات"}</h3>
            <button type="button" className="shil-equipment-field" onClick={() => setIsEquipmentPickerOpen((v) => !v)}>
              <span>{isReadyScenarioEquipmentFlow ? "اصلاح تجهیزات سناریوی انتخابی" : "انتخاب از بانک ۲۵۰ تجهیز"}</span>
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
            <h3 className="shil-section-title">ورودی مستقیم روش انتخاب‌شده</h3>
            {method === "solar_panel_power" ? (
              <>
                <div className="shil-form-grid">
                  <label>بانک کامل پنل خورشیدی<select className="shil-input" value={selectedPanelId} onChange={(e) => setSelectedPanelId(e.target.value)}>{SHIL_SOLAR_PANELS.map((panel) => <option key={panel.id} value={panel.id}>{panel.title} / {panel.powerW}W / {panel.type}</option>)}</select></label>
                  <label>توان هر پنل W<input className="shil-input" value={panelPowerW} readOnly /></label>
                  <label>تعداد پنل<input className="shil-input" value={panelCount} onChange={(e) => setPanelCount(e.target.value)} placeholder="مثلاً 24" inputMode="numeric" /></label>
                  <label>ساعات آفتاب مؤثر PSH<input className="shil-input" value={psh} onChange={(e) => setPsh(e.target.value)} placeholder={`از شرایط محیطی: ${envSolarDefaults.psh}`} inputMode="decimal" /></label>
                  <label>تلفات کل سیستم ٪<input className="shil-input" value={lossPercent} onChange={(e) => setLossPercent(e.target.value)} placeholder={`از شرایط محیطی: ${envSolarDefaults.totalLoss}%`} inputMode="decimal" /></label>
                  <label>راندمان مؤثر سیستم ٪<input className="shil-input" value={(100 - toNumber(lossPercent, 0)).toFixed(1)} onChange={(e) => { const efficiency = Math.max(5, Math.min(100, toNumber(e.target.value, 0))); setLossPercent(String((100 - efficiency).toFixed(1))); }} placeholder="محاسبه از شرایط محیطی" inputMode="decimal" /></label>
                  <label>مسیر خروجی AC<select className="shil-input" value={acVoltageRoute} onChange={(e) => setAcVoltageRoute(e.target.value)}><option value="220">۲۲۰ ولت تک‌فاز</option><option value="380">۳۸۰ ولت سه‌فاز</option></select></label>
                  <label>تقسیم توان بین چند اینورتر<input className="shil-input" value={inverterSplitCount} onChange={(e) => setInverterSplitCount(e.target.value)} placeholder="مثلاً 1 یا 2 یا 6" inputMode="numeric" /></label>
                </div>
                <div className="shil-summary-grid"><div><span>توان کل پنل‌ها</span><strong>{(totalPanelPowerW / 1000).toFixed(2)} kW</strong></div><div><span>تولید روزانه بدون تلفات</span><strong>{rawPvDailyKWh} kWh</strong></div><div><span>تولید روزانه با تلفات</span><strong>{calculatedPvDailyKWh} kWh</strong></div><div><span>توان موثر معیار مسیر</span><strong>{(effectivePanelPowerW / 1000).toFixed(2)} kW</strong></div>{inverterCountNormalized > 1 ? <div><span>سهم هر اینورتر</span><strong>{((totalPanelPowerW / 1000) / inverterCountNormalized).toFixed(2)} kW</strong></div> : null}<div><span>محدوده طراحی</span><strong>{isUtilityPanelScale ? "نیروگاهی / توان موثر بالای ۳۰kW" : "مصرفی عادی / توان موثر زیر ۳۰kW"}</strong></div><div><span>منبع PSH و تلفات</span><strong>{environment?.city || "شرایط محیطی"}</strong></div><div><span>راندمان مؤثر</span><strong>{(100 - toNumber(lossPercent, 0)).toFixed(1)}٪</strong></div><div><span>افت جهت/زاویه</span><strong>{envSolarDefaults.orientation.toFixed(1)}٪</strong></div></div>
                <label className="shil-check-row"><input type="checkbox" checked={showManualPanelSplit} onChange={(e) => setShowManualPanelSplit(e.target.checked)} />تقسیم دستی پنل‌ها بین اینورترها</label>
                {showManualPanelSplit ? (
                  <div className="shil-form-grid shil-inverter-split-grid">
                    {manualPanelDistribution.map((count, index) => (
                      <label key={index}>اینورتر {index + 1}<input className="shil-input" value={count} onChange={(e) => setManualPanelDistribution((prev) => prev.map((item, idx) => idx === index ? e.target.value : item))} inputMode="numeric" /></label>
                    ))}
                  </div>
                ) : (
                  <div className="shil-summary-grid">
                    {defaultPanelDistribution.map((count, index) => <div key={index}><span>اینورتر {index + 1}</span><strong>{count} پنل</strong></div>)}
                  </div>
                )}
                {distributionMismatch ? <p className="shil-warning-line">جمع پنل‌های تقسیم‌شده باید دقیقاً برابر {panelCountNormalized} پنل باشد؛ مقدار فعلی {distributionTotal} پنل است.</p> : null}
                <div className="shil-summary-grid shil-inverter-layout-grid">
                  {inverterPanelLayouts.map((row) => (
                    <div key={row.index}><span>اینورتر {row.index}</span><strong>{row.count} پنل / {row.powerKW} kW</strong><small>{row.series} سری × {row.parallel} موازی</small></div>
                  ))}
                </div>
                {isUtilityPanelScale && !isUtilityGateway ? (<div className="shil-expert-box shil-utility-gateway-warning"><strong>توان از محدوده مسیر معمولی عبور کرده است.</strong><p>این مسیر برای طراحی خورشیدی معمولی و سبک نگه داشته می‌شود. برای توان موثر بالای ۳۰kW پس از تلفات/راندمان، بلوک‌های نیروگاهی داخل مسیر پنل یا برق اضطراری باز نمی‌شوند؛ از کارت مستقل «نیروگاهی» در صفحه انتخاب مسیر پروژه استفاده کن.</p><button type="button" className="shil-secondary-wide" onClick={goToUtilityGateway}>ورود به درگاه نیروگاهی</button></div>) : null}
                {isUtilityPanelScale && isUtilityGateway ? (<div className="shil-expert-box"><strong>درگاه نیروگاهی فعال است.</strong><p>این مسیر مستقل برای طراحی‌های بالای ۳۰kW، بلوک‌بندی MW، MV، ترانس و Grid Study مقدماتی استفاده می‌شود.</p></div>) : null}
                <p className="shil-muted-note">در این مسیر، PSH و تلفات از شرایط محیطی خوانده می‌شوند. اگر توان موثر پس از تلفات/راندمان از ۳۰kW بالاتر برود، اپ به‌جای شلوغ کردن مسیر معمولی، کاربر را به درگاه مستقل نیروگاهی هدایت می‌کند.</p>
              </>
            ) : (
              <div className="shil-form-grid">
                {method === "energy" ? <label>انرژی روزانه kWh<input className="shil-input" value={manualEnergyKWh} onChange={(e) => setManualEnergyKWh(e.target.value)} placeholder="مثلاً 12.5" inputMode="decimal" /></label> : null}
                {method === "power" ? <label>توان کل W<input className="shil-input" value={manualPowerW} onChange={(e) => setManualPowerW(e.target.value)} placeholder="مثلاً 3500" inputMode="numeric" /></label> : null}
                {method === "current" ? <label>جریان کل A<input className="shil-input" value={manualCurrentA} onChange={(e) => setManualCurrentA(e.target.value)} placeholder="مثلاً 16" inputMode="decimal" /></label> : null}
                <label>ولتاژ AC<input className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)} inputMode="numeric" /></label>
                <label>ساعت استفاده / زمان برق اضطراری مورد نظر<input className="shil-input" value={manualHours} onChange={(e) => setManualHours(e.target.value)} inputMode="decimal" /></label>
              </div>
            )}
          </section>
        ) : null}

        {method === "solar_panel_power" && solarPanelPreview ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">خروجی زنده توان پنل خورشیدی</h3>
            <div className="shil-summary-grid">
              <div><span>توان کل پنل‌ها</span><strong>{solarPanelPreview.array?.powerKW} kW</strong></div>
              <div><span>تولید خام روزانه</span><strong>{rawPvDailyKWh} kWh</strong></div>
              <div><span>تولید واقعی با تلفات</span><strong>{solarPanelPreview.generatedDailyKWh} kWh</strong></div>
              <div><span>توان موثر معیار مسیر</span><strong>{((solarPanelPreview.effectivePanelPowerW || 0) / 1000).toFixed(2)} kW</strong></div>
              <div><span>مسیر AC</span><strong>{solarPanelPreview.acVoltageRoute === 380 ? "۳۸۰ ولت سه‌فاز" : "۲۲۰ ولت تک‌فاز"}</strong></div>
              {solarPanelPreview.inverterSplitCount > 1 ? <div><span>تقسیم اینورتر</span><strong>{solarPanelPreview.inverterSplitCount} مسیر × {solarPanelPreview.inverterPowerShareKW} kW</strong></div> : null}
              <div><span>تقسیم پنل بین اینورترها</span><strong>{solarPanelPreview.inverterPanelDistribution?.join(" / ")} پنل</strong></div>
              <div><span>امتیاز مهندسی</span><strong>{solarPanelPreview.score} / 100</strong></div>
              <div><span>وضعیت</span><strong>{solarPanelPreview.levelLabel}</strong></div>
            </div>
            {solarPanelPreview.recommendations?.length ? (
              <ul className="shil-warning-list">
                {solarPanelPreview.recommendations.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </section>
        ) : null}

        {method !== "solar_panel_power" ? (
        <section className="shil-env-card">
          <h3 className="shil-section-title">خروجی زنده موتور بار</h3>
          <div className="shil-summary-grid">
            <div><span>تعداد تجهیزات</span><strong>{enginePreview.selectedCount || "Auto"}</strong></div>
            <div><span>توان کل</span><strong>{enginePreview.totalPowerW} W</strong></div>
            <div><span>انرژی روزانه</span><strong>{enginePreview.totalEnergyKWh} kWh</strong></div>
            <div><span>جریان AC</span><strong>{enginePreview.acCurrentA} A</strong></div>
            <div><span>جریان راه‌اندازی</span><strong>{enginePreview.startCurrentA} A</strong></div>
            <div><span>پیک استارت</span><strong>{enginePreview.surgePowerW} W</strong></div>
            <div><span>موتوری/سافت</span><strong>{enginePreview.motorCount || 0}/{enginePreview.softStarterCount || 0}</strong></div>
            <div><span>باتری مرجع</span><strong>{Math.round(enginePreview.recommendedBatteryWh / 1000)} kWh</strong></div>
          </div>
          {showExpert ? (
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
            <h3 className="shil-section-title">پروفایل مصرف تخمینی</h3>
            <div className="shil-summary-grid">
              <div><span>صبح</span><strong>{Math.round(enginePreview.loadProfile.buckets.morning / 1000)} kWh</strong></div>
              <div><span>ظهر</span><strong>{Math.round(enginePreview.loadProfile.buckets.noon / 1000)} kWh</strong></div>
              <div><span>عصر</span><strong>{Math.round(enginePreview.loadProfile.buckets.evening / 1000)} kWh</strong></div>
              <div><span>شب</span><strong>{Math.round(enginePreview.loadProfile.buckets.night / 1000)} kWh</strong></div>
            </div>
          </section>
        ) : null}

        {method === "equipment" || method === "profile" ? (
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
                        سافت‌استارتر دارد؛ جریان راه‌اندازی از ۲.۵× به ۱.۲× جریان نامی کاهش یابد
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

        {scaleWarning ? <div className="shil-inline-warning">{scaleWarning}<button type="button" className="shil-secondary-wide" onClick={goToUtilityGateway}>ورود به درگاه نیروگاهی</button></div> : null}
        <button type="button" className="shil-primary-wide" onClick={confirmLoad}>
          {isReadyScenarioEquipmentFlow ? "تأیید لیست تجهیزات و ادامه مسیر پروژه" : "تأیید اطلاعات و ورود به پیکربندی تنظیمات"}
        </button>
      </div>
    </ShilPageShell>
  );
}
