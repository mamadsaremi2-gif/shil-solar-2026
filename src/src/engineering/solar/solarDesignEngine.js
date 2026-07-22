import {
  batteryEnergyKWh,
  batterySeriesCountForInverter,
  batteryVoltageClass,
  designPvStringLayout,
  findById,
  number,
  positive,
  selectCompatibleBattery,
  selectDefaultPanel,
  selectSmartInverter,
} from "./solarBankRules.js";

function resolveMethodSummary(handoff = {}) {
  return handoff.methodSummary || handoff.summary || handoff.routePayload?.methodSummary || null;
}

function resolveLoad(handoff = {}) {
  const normalized = handoff.normalizedLoad || {};
  const engine = handoff.engineResult || {};
  const totalEnergyWh = positive(engine.totalEnergyWh, 0);

  return {
    method: handoff.source?.method || normalized.method || engine.method || "equipment",
    totalPowerW: positive(normalized.totalPowerW, positive(engine.totalPowerW, positive(engine.recommendedInverterW, 0))),
    dailyEnergyKWh: positive(
      normalized.dailyEnergyKWh,
      positive(normalized.totalEnergyKWh, positive(engine.totalEnergyKWh, totalEnergyWh > 0 ? totalEnergyWh / 1000 : 0))
    ),
    surgePowerW: positive(normalized.surgePowerW, positive(engine.surgePowerW, 0)),
    voltageAC: positive(normalized.voltageAC, positive(engine.voltageAC, 220)),
    phaseAC: normalized.phaseAC || engine.phaseAC || (positive(normalized.voltageAC, positive(engine.voltageAC, 220)) >= 380 ? "three" : "single"),
  };
}

function resolveAutonomy(handoff = {}, settings = {}) {
  const autonomy = handoff.autonomy || handoff.systemHints?.autonomy || {};
  const hasSettingHours = settings.autonomyHours !== undefined && settings.autonomyHours !== null && settings.autonomyHours !== "";
  const hasSettingDays = settings.autonomyDays !== undefined && settings.autonomyDays !== null && settings.autonomyDays !== "";
  const hours = Math.max(0, number(hasSettingHours ? settings.autonomyHours : (autonomy.hours ?? autonomy.inputHours ?? autonomy.backupHours), 0));
  const days = Math.max(0, number(hasSettingDays ? settings.autonomyDays : (autonomy.days ?? autonomy.inputDays), 0));
  return { hours, days, totalHours: Number((hours + days * 24).toFixed(2)) };
}

function uniqueMessages(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function calcRequiredBatteryKWh(finalEnergyKWh, autonomy, needsBattery) {
  if (!needsBattery) return 0;
  const autonomyDays = Math.max(number(autonomy.days, 0), number(autonomy.hours, 0) / 24);
  return Math.round(finalEnergyKWh * Math.max(autonomyDays, 0) * 100) / 100;
}

export function buildSolarSystemDesign({ handoff = {}, settings = {}, banks = {} }) {
  const panels = Array.isArray(banks.panels) ? banks.panels : [];
  const inverters = Array.isArray(banks.inverters) ? banks.inverters : [];
  const batteries = Array.isArray(banks.batteries) ? banks.batteries : [];

  const load = resolveLoad(handoff);
  const methodSummary = resolveMethodSummary(handoff);
  const routePayload = handoff.routePayload || {};
  const environment = handoff.environmentSnapshot || handoff.environment || {};
  const designAdjustmentPercent = Math.min(30, Math.max(10, number(settings.designAdjustmentPercent ?? settings.reservePercent ?? 20, 20)));
  const designAdjustmentMode = String(settings.designAdjustmentMode || settings.reserveMode || "decrease").toLowerCase();
  const inverterAdjustmentFactor = designAdjustmentMode === "increase"
    ? 1 + designAdjustmentPercent / 100
    : 1 - designAdjustmentPercent / 100;
  // Legacy aliases are kept only for old consumers; they are NOT applied to panel count.
  const reserveFactor = inverterAdjustmentFactor;
  const reserveMode = designAdjustmentMode;
  const derateFactor = 1;
  const method = handoff?.source?.method || load.method || "equipment";
  const systemType = settings.systemType || handoff.source?.scenario || "offgrid";
  const autonomy = resolveAutonomy(handoff, settings);
  const psh = positive(environment.peakSunHours || environment.psh || environment.solarDefaults?.psh || routePayload.psh, 5);
  const explicitEfficiencyRaw =
    environment.effectiveEfficiency ??
    environment.finalEfficiency ??
    environment.environmentEfficiency ??
    environment.assessment?.effectiveEfficiency ??
    environment.solarDefaults?.effectiveEfficiency ??
    routePayload.effectiveEfficiency ??
    routePayload.efficiency;
  const explicitEfficiency = explicitEfficiencyRaw !== undefined && explicitEfficiencyRaw !== null && explicitEfficiencyRaw !== ""
    ? number(explicitEfficiencyRaw, NaN)
    : NaN;
  const normalizedExplicitEfficiency = Number.isFinite(explicitEfficiency)
    ? (explicitEfficiency > 1 ? explicitEfficiency / 100 : explicitEfficiency)
    : NaN;
  const explicitLossPercentRaw =
    environment.totalLossPercent ??
    environment.lossPercent ??
    environment.assessment?.totalLossPercent ??
    environment.solarDefaults?.totalLoss ??
    routePayload.lossPercent;
  const explicitLossRatio = explicitLossPercentRaw !== undefined && explicitLossPercentRaw !== null && explicitLossPercentRaw !== ""
    ? number(explicitLossPercentRaw, NaN) / 100
    : NaN;
  const lossRatio = Number.isFinite(normalizedExplicitEfficiency)
    ? Math.min(0.65, Math.max(0, 1 - normalizedExplicitEfficiency))
    : Number.isFinite(explicitLossRatio)
      ? Math.min(0.65, Math.max(0, explicitLossRatio))
      : Math.min(0.45, Math.max(0, number(environment.lossRatio ?? routePayload.lossRatio, 0.18)));
  const efficiency = Math.max(0.5, Math.min(1, Number.isFinite(normalizedExplicitEfficiency) ? normalizedExplicitEfficiency : 1 - lossRatio));
  const normalizedSystemType = String(systemType || "offgrid").toLowerCase();
  const needsBattery = normalizedSystemType === "ongrid" || normalizedSystemType === "on-grid"
    ? false
    : Boolean(
        handoff.systemHints?.needsBattery === true ||
        normalizedSystemType === "offgrid" ||
        normalizedSystemType === "hybrid" ||
        autonomy.hours > 0 ||
        autonomy.days > 0
      );

  const basePowerW =
    methodSummary?.basis === "pv_generation"
      ? positive(routePayload.totalPanelPowerW || routePayload.effectivePanelPowerW, load.totalPowerW)
      : load.totalPowerW;
  // Raw consumption power is kept untouched. PV array power is calculated later from energy, PSH and environment efficiency.
  const designPowerW = Math.ceil(basePowerW);
  const finalPowerW = Math.ceil(basePowerW);

  const environmentEnergyKWh = (basePowerW / 1000) * psh;
  const hasExplicitDailyEnergy = positive(routePayload.dailyEnergyKWh || routePayload.totalEnergyKWh || routePayload.generatedDailyKWh || routePayload.usableDailyEnergyKWh, 0) > 0;
  const rawEnergyKWh =
    methodSummary?.basis === "pv_generation"
      ? positive(routePayload.generatedDailyKWh || routePayload.usableDailyEnergyKWh, load.dailyEnergyKWh)
      : ["power", "current", "total_power"].includes(String(method || "").toLowerCase()) && !hasExplicitDailyEnergy
        ? environmentEnergyKWh
        : positive(load.dailyEnergyKWh, environmentEnergyKWh);
  const baseEnergyKWh = rawEnergyKWh;
  // Daily energy remains the route result. The panel count is based on energy / (PSH * environment efficiency).
  const designEnergyKWh = Math.round(rawEnergyKWh * 100) / 100;
  const finalEnergyKWh = designEnergyKWh;

  const preferredPanel = selectDefaultPanel(
    panels,
    settings.panelId || routePayload.panelId || routePayload.selectedPanelId,
    positive(routePayload.panelPowerW, 620)
  );
  const panelPowerW = positive(preferredPanel?.powerW || preferredPanel?.ratedPowerW, 550);

  const shouldUseProvidedPanelCount = methodSummary?.basis === "pv_generation" && positive(routePayload.panelCount, 0) > 0;
  const energySizingKWh = shouldUseProvidedPanelCount ? positive(routePayload.generatedDailyKWh || routePayload.usableDailyEnergyKWh, baseEnergyKWh) : finalEnergyKWh;
  const pvArrayBasePowerW = Math.ceil(((energySizingKWh * 1000) / Math.max(0.1, psh * efficiency)) - 1e-9);
  const energyBasedPanelCount = Math.ceil((pvArrayBasePowerW / Math.max(1, panelPowerW)) - 1e-9);
  const powerBasedPanelCount = energyBasedPanelCount;
  const requiredPanelCount = shouldUseProvidedPanelCount
    ? Math.max(1, Math.ceil(positive(routePayload.panelCount, 1)))
    : Math.max(1, energyBasedPanelCount);

  const inverterSizingPowerW = Math.max(1, Math.ceil(pvArrayBasePowerW * inverterAdjustmentFactor));
  const preferredInverter = selectSmartInverter(inverters, settings.inverterId, inverterSizingPowerW, systemType);
  const inverterRatedW = positive(preferredInverter?.ratedPowerW || preferredInverter?.powerW, inverterSizingPowerW || 5000);
  const inverterCount = Math.max(1, Math.ceil(inverterSizingPowerW / Math.max(1, inverterRatedW)));
  const inverterDcVoltage = batteryVoltageClass(preferredInverter?.batteryVoltage || preferredInverter?.dcVoltage || 48);

  const panelsPerInverterTarget = Math.max(1, Math.ceil(requiredPanelCount / Math.max(1, inverterCount)));
  const layout = designPvStringLayout(
    preferredPanel || {},
    preferredInverter || {},
    panelsPerInverterTarget,
    positive(environment.minTemperatureC, 0)
  );

  const panelCount = requiredPanelCount;
  const stringActualPanelCount = layout.actualPanelCount * Math.max(1, inverterCount);
  const arrayPowerW = panelCount * panelPowerW;
  const estimatedDailyKWh = Math.round((arrayPowerW / 1000) * psh * efficiency * 100) / 100;

  const requiredBatteryKWh = calcRequiredBatteryKWh(finalEnergyKWh, autonomy, needsBattery);
  const selectedBattery = selectCompatibleBattery(batteries, preferredInverter || {}, settings.batteryId, requiredBatteryKWh);
  const batterySeriesCount = selectedBattery ? batterySeriesCountForInverter(selectedBattery, preferredInverter || {}) : 0;
  const unitBatteryKWh = selectedBattery ? batteryEnergyKWh(selectedBattery) : 0;
  const seriesStringEnergyKWh = unitBatteryKWh * Math.max(1, batterySeriesCount);
  const parallelStringCount = needsBattery && seriesStringEnergyKWh > 0 ? Math.max(1, Math.ceil(requiredBatteryKWh / seriesStringEnergyKWh)) : 0;
  const batteryCount = needsBattery && selectedBattery ? Math.max(1, batterySeriesCount) * Math.max(1, parallelStringCount) : 0;
  const grossBatteryKWh = Math.round(unitBatteryKWh * batteryCount * 100) / 100;

  const bankWarnings = [
    !preferredPanel ? "پنل مناسب در بانک تجهیزات پیدا نشد؛ محاسبات با مقدار پیش‌فرض پنل انجام شد." : null,
    !preferredInverter ? "اینورتر مناسب در بانک تجهیزات پیدا نشد؛ محاسبات با مقدار پیش‌فرض اینورتر انجام شد." : null,
    needsBattery && !selectedBattery ? "باتری برای این مسیر الزامی است اما بانک باتری سازگار پیدا نشد." : null,
    needsBattery && selectedBattery && grossBatteryKWh < requiredBatteryKWh
      ? "ظرفیت باتری انتخاب‌شده کمتر از انرژی پشتیبان موردنیاز است."
      : null,
    (stringActualPanelCount - requiredPanelCount) > 0 ? `آرایش استرینگ پیشنهادی ظرفیت ${stringActualPanelCount} پنل دارد؛ تعداد اجرایی ثبت‌شده همان ${requiredPanelCount} پنل است و توزیع نهایی روی MPPT باید در نقشه اجرا تنظیم شود.` : null,
    preferredInverter && arrayPowerW > positive(preferredInverter.maxPvPowerW, Infinity) * inverterCount
      ? "توان آرایه PV از ظرفیت ورودی اینورتر انتخاب‌شده بیشتر است؛ اینورتر بزرگ‌تر یا اینورتر موازی پیشنهاد می‌شود."
      : null,
    preferredInverter && inverterCount > 1
      ? `توان طراحی از ظرفیت یک اینورتر عبور کرده است؛ ${inverterCount} عدد اینورتر به‌صورت موازی پیشنهاد می‌شود.`
      : null,
  ];

  const warnings = uniqueMessages([...(layout.compatibility.issues || []).map((issue) => issue.message), ...bankWarnings]);
  const hasError = layout.compatibility.issues?.some((issue) => issue.severity === "error");

  return {
    version: 5,
    source: handoff.source || {},
    methodSummary,
    handoff,
    valid: !hasError && Boolean(preferredPanel) && Boolean(preferredInverter) && (!needsBattery || Boolean(selectedBattery)),
    load: {
      ...load,
      basePowerW,
      finalPowerW,
      baseEnergyKWh,
      finalEnergyKWh,
      reserveFactor,
      reserveMode,
      derateFactor,
      designPowerW,
      designEnergyKWh,
      rawEnergyKWh,
      energySizingKWh,
      pvArrayBasePowerW,
      inverterSizingPowerW,
      designAdjustmentPercent,
      designAdjustmentMode,
      inverterAdjustmentFactor,
    },
    system: {
      systemType,
      needsBattery,
      autonomy,
      psh,
      lossRatio,
      efficiency,
    },
    panel: preferredPanel,
    inverter: preferredInverter ? { ...preferredInverter, count: inverterCount, dcVoltage: inverterDcVoltage } : null,
    battery: selectedBattery
      ? {
          item: selectedBattery,
          count: batteryCount,
          unitEnergyKWh: Math.round(unitBatteryKWh * 100) / 100,
          requiredEnergyKWh: requiredBatteryKWh,
          grossEnergyKWh: grossBatteryKWh,
          seriesCount: batterySeriesCount,
          parallelCount: parallelStringCount,
          packVoltage: Math.round(positive(selectedBattery.nominalVoltage || selectedBattery.voltageV, 0) * Math.max(1, batterySeriesCount) * 10) / 10,
        }
      : null,
    pvArray: {
      requestedPanelCount: requiredPanelCount,
      panelsPerInverterTarget,
      panelCount,
      actualPanelCount: panelCount,
      stringActualPanelCount,
      extraPanels: Math.max(0, stringActualPanelCount - requiredPanelCount),
      arrayPowerW,
      arrayPowerKW: Math.round(arrayPowerW / 10) / 100,
      baseRequiredPowerW: pvArrayBasePowerW,
      baseRequiredPowerKW: Math.round(pvArrayBasePowerW / 10) / 100,
      inverterSizingPowerW,
      inverterSizingPowerKW: Math.round(inverterSizingPowerW / 10) / 100,
      seriesCount: layout.seriesCount,
      parallelCount: layout.parallelCount,
      inverterCount,
      totalStringCount: layout.parallelCount * Math.max(1, inverterCount),
      estimatedDailyKWh,
      energyBasedPanelCount,
      powerBasedPanelCount,
    },
    compatibility: { pvInverter: layout.compatibility },
    warnings,
    selectedBanks: {
      panelId: preferredPanel?.id || null,
      inverterId: preferredInverter?.id || null,
      batteryId: selectedBattery?.id || null,
    },
  };
}
