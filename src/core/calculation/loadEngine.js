import { EMERGENCY_BASE_LOAD_HOURS, EMERGENCY_DEFAULT_BACKUP_HOURS, clampEmergencyBackupHours, emergencyBackupEnergyWh } from "./emergencySizingRules.js";
export const METHOD_LABELS = {
  equipment: "لیست تجهیزات",
  profile: "پروفایل مصرف",
  energy: "انرژی مورد نیاز",
  solar_panel_power: "توان پنل خورشیدی",
  power: "توان کل",
  current: "جریان کل",
};

function round(value, digits = 2) {
  const n = Number(value || 0);
  return Number(n.toFixed(digits));
}

function detectMotorLoad(item = {}) {
  return item.isMotor === true ||
    item.type === "inductive" ||
    Number(item.startupFactor || item.surgeFactor || 1) > 1.7 ||
    /پمپ|موتور|کمپرسور|کولر|فن|درب|کرکره|چیلر/i.test(String(item.title || ""));
}

export function normalizeLoadItem(item = {}, options = {}) {
  const quantity = Number(item.quantity ?? 1) || 1;
  const ratedPowerW = Number(item.ratedPowerW ?? item.defaultPowerW ?? 0) || 0;
  const domain = options.domain || item.domain || "solar";
  const sourceUsageHoursPerDay = Number(item.usageHoursPerDay ?? item.defaultHours ?? 0) || 0;
  const usageHoursPerDay = domain === "emergency" ? EMERGENCY_BASE_LOAD_HOURS : sourceUsageHoursPerDay;
  const simultaneityFactor = Number(item.simultaneityFactor ?? item.diversityFactor ?? 1) || 1;
  const diversityFactor = simultaneityFactor;
  const powerFactor = Number(item.powerFactor ?? (detectMotorLoad(item) ? 0.82 : 0.95)) || 0.95;
  // Consumer-bank powers are stored as electrical input power. Efficiency is therefore
  // shown for traceability, but it does not inflate the registered electrical load.
  const efficiency = Number(item.efficiency ?? 1) || 1;
  const voltage = Number(item.voltage ?? 220) || 220;
  const phase = item.phase || (voltage >= 380 ? "three" : "single");
  const isMotor = detectMotorLoad(item);
  const hasSoftStarter = Boolean(item.hasSoftStarter);
  const motorStartCurrentFactor = isMotor ? Number(item.motorStartCurrentFactor ?? 2.5) || 2.5 : 1;
  const softStarterFactor = isMotor ? Number(item.softStarterFactor ?? 1.2) || 1.2 : 1;
  const currentStartFactor = isMotor ? (hasSoftStarter ? softStarterFactor : motorStartCurrentFactor) : 1;
  const surgeFactor = Number(item.surgeFactor ?? item.startupFactor ?? currentStartFactor ?? 1) || 1;

  const nominalCurrentA = phase === "three"
    ? ratedPowerW / (Math.sqrt(3) * voltage * powerFactor)
    : ratedPowerW / (voltage * powerFactor);
  const effectivePowerW = Math.round(ratedPowerW * quantity * simultaneityFactor);
  const dailyEnergyWh = Math.round(ratedPowerW * quantity * usageHoursPerDay * simultaneityFactor);
  const runningCurrentA = nominalCurrentA * quantity * simultaneityFactor;
  const startCurrentA = nominalCurrentA * quantity * currentStartFactor;
  const surgePowerW = Math.round(voltage * startCurrentA * powerFactor * (phase === "three" ? Math.sqrt(3) : 1));

  return {
    ...item,
    quantity,
    ratedPowerW,
    usageHoursPerDay,
    simultaneityFactor,
    diversityFactor,
    powerFactor,
    efficiency,
    voltage,
    phase,
    isMotor,
    hasSoftStarter,
    motorStartCurrentFactor,
    softStarterFactor,
    currentStartFactor,
    surgeFactor,
    effectivePowerW,
    dailyEnergyWh,
    dailyEnergyKWh: round(dailyEnergyWh / 1000, 2),
    nominalCurrentA: round(nominalCurrentA, 2),
    runningCurrentA: round(runningCurrentA, 2),
    startCurrentA: round(startCurrentA, 2),
    surgePowerW,
    currentA: round(runningCurrentA, 2),
    expertReason: isMotor
      ? `بار موتوری؛ جریان راه‌اندازی ${hasSoftStarter ? "با سافت‌استارتر" : "بدون سافت‌استارتر"} برابر ${currentStartFactor} جریان نامی لحاظ شد.`
      : `بار غیرموتوری؛ ضریب توان ${powerFactor} و ضریب همزمانی ${simultaneityFactor} پشت پرده اعمال شد.`,
  };
}

export function buildLoadProfile(items = [], options = {}) {
  const normalizedItems = items.map((item) => normalizeLoadItem(item, options));
  const buckets = { morning: 0, noon: 0, evening: 0, night: 0 };
  normalizedItems.forEach((item) => {
    const profile = item.profile || "mixed";
    const e = item.dailyEnergyWh;
    if (profile === "day") buckets.noon += e;
    else if (profile === "night") buckets.night += e;
    else if (profile === "evening") buckets.evening += e;
    else if (profile === "morning") buckets.morning += e;
    else {
      buckets.morning += Math.round(e * 0.2);
      buckets.noon += Math.round(e * 0.35);
      buckets.evening += Math.round(e * 0.3);
      buckets.night += Math.round(e * 0.15);
    }
  });
  const peakBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "evening";
  return {
    buckets,
    peakBucket,
    peakHours: peakBucket === "night" ? [21, 22, 23] : peakBucket === "noon" ? [11, 12, 13, 14] : peakBucket === "morning" ? [7, 8, 9] : [18, 19, 20, 21],
    simultaneityFactor: Number(options.simultaneityFactor ?? 0.78),
  };
}

export function runLoadEngine(input = {}) {
  const domain = input.domain || localStorage.getItem("shil:scenarioDomain") || "solar";
  const method = input.method || "equipment";
  const voltageAC = Number(input.voltageAC ?? 220) || 220;
  const phaseAC = input.phaseAC || (voltageAC >= 380 ? "three" : "single");
  const directElectricalMethod = method === "power" || method === "current";
  const powerFactorAC = Number(input.powerFactorAC ?? (directElectricalMethod ? 1 : 0.95)) || (directElectricalMethod ? 1 : 0.95);
  const manualCurrentA = Math.max(0, Number(input.manualCurrentA ?? input.totalCurrentA ?? 0) || 0);
  const phaseFactorAC = phaseAC === "three" ? Math.sqrt(3) : 1;
  const dcBusVoltage = Number(input.dcBusVoltage ?? (domain === "solar" ? 48 : 24)) || 48;
  const selectedItems = (input.selectedItems || []).map((item) => normalizeLoadItem(item, { domain }));
  const scenario = input.scenario || null;
  const fallbackPowerW = Number(scenario?.loadEstimate ?? input.manualPowerW ?? 1000) || 1000;
  const emergencyBackupHours = domain === "emergency"
    ? clampEmergencyBackupHours(input.backupHours ?? scenario?.backupHours ?? input.manualHours ?? EMERGENCY_DEFAULT_BACKUP_HOURS)
    : 0;
  const fallbackHours = domain === "emergency"
    ? emergencyBackupHours
    : (Number(scenario?.backupHours ?? input.manualHours ?? 5) || 5);

  const equipmentPowerW = selectedItems.reduce((sum, item) => sum + item.effectivePowerW, 0);
  const equipmentEnergyWh = selectedItems.reduce((sum, item) => sum + item.dailyEnergyWh, 0);
  const equipmentSurgeW = selectedItems.reduce((sum, item) => sum + Math.max(item.surgePowerW, item.effectivePowerW), 0);
  const totalRunningCurrentA = selectedItems.reduce((sum, item) => sum + Number(item.runningCurrentA || item.currentA || 0), 0);
  const totalStartCurrentA = selectedItems.reduce((sum, item) => sum + Number(item.startCurrentA || item.currentA || 0), 0);

  const currentDerivedPowerW = method === "current" && manualCurrentA > 0
    ? manualCurrentA * voltageAC * phaseFactorAC
    : 0;
  const totalPowerW = Math.round(currentDerivedPowerW || Number(input.manualPowerW || 0) || equipmentPowerW || fallbackPowerW);
  const emergencyStorageEnergyWh = domain === "emergency" ? emergencyBackupEnergyWh(totalPowerW, emergencyBackupHours) : 0;
  const totalEnergyWh = Math.round(Number(input.manualEnergyWh || 0) || (domain === "emergency" ? emergencyStorageEnergyWh : equipmentEnergyWh) || (totalPowerW * fallbackHours));
  const surgePowerW = Math.round(Number(input.manualSurgeW || 0) || equipmentSurgeW || (totalPowerW * 1.6));
  const fallbackCurrentA = totalPowerW / Math.max(1, phaseFactorAC * voltageAC * powerFactorAC);
  const acCurrentA = method === "current" && manualCurrentA > 0
    ? round(manualCurrentA, 2)
    : selectedItems.length
      ? round(totalRunningCurrentA, 2)
      : round(fallbackCurrentA, 2);
  const startCurrentA = selectedItems.length ? round(totalStartCurrentA, 2) : round(acCurrentA * 1.6, 2);
  const dcCurrentA = round(totalPowerW / dcBusVoltage, 2);
  const loadProfile = input.loadProfile || buildLoadProfile(selectedItems, input);
  const motorCount = selectedItems.filter((item) => item.isMotor).length;
  const softStarterCount = selectedItems.filter((item) => item.isMotor && item.hasSoftStarter).length;

  const recommendedVoltage = totalPowerW > 5000 ? 96 : totalPowerW > 2500 ? 48 : 24;
  const recommendedInverterW = Math.ceil((surgePowerW * 1.15) / 500) * 500;
  const recommendedBatteryWh = Math.round(totalEnergyWh * (domain === "emergency" ? 1.25 : 1.45));

  return {
    domain,
    method,
    selectedCount: selectedItems.length,
    selectedItems,
    totalEnergyWh,
    totalEnergyKWh: round(totalEnergyWh / 1000, 2),
    baseLoadHours: domain === "emergency" ? EMERGENCY_BASE_LOAD_HOURS : null,
    baseLoadEnergyWh: domain === "emergency" ? equipmentEnergyWh : null,
    backupHours: domain === "emergency" ? emergencyBackupHours : null,
    backupEnergyWh: domain === "emergency" ? emergencyStorageEnergyWh : null,
    totalPowerW,
    surgePowerW,
    totalCurrentA: acCurrentA,
    acCurrentA,
    dcCurrentA,
    startCurrentA,
    voltageAC,
    phaseAC,
    powerFactorAC,
    dcBusVoltage,
    motorCount,
    softStarterCount,
    loadProfile,
    recommendedVoltage,
    recommendedInverterW,
    recommendedBatteryWh,
    expertSummary: {
      rule: domain === "emergency"
        ? "ضریب توان و ضریب همزمانی حفظ شده‌اند؛ ساعت مبنای همه تجهیزات ۱ ساعت است و زمان پشتیبانی جداگانه برای انرژی باتری اعمال می‌شود."
        : "ضریب توان، ضریب همزمانی، ساعت پیش‌فرض و جریان راه‌اندازی پشت پرده اعمال شده‌اند.",
      motorStartRule: "برای بارهای موتوری به‌صورت پیش‌فرض ۲.۵ برابر جریان نامی و در صورت فعال بودن سافت‌استارتر ۱.۲ برابر جریان نامی لحاظ می‌شود.",
      transferredFields: ["totalPowerW", "totalEnergyWh", "acCurrentA", "startCurrentA", "surgePowerW", "selectedItems"],
    },
    nextEngine: domain === "emergency" ? "emergency-core" : "solar-core",
    warnings: buildLoadWarnings({ totalPowerW, totalEnergyWh, surgePowerW, selectedItems, domain, method }),
    createdAt: new Date().toISOString(),
  };
}

function buildLoadWarnings({ totalPowerW, totalEnergyWh, surgePowerW, selectedItems, domain, method }) {
  const warnings = [];
  if (!selectedItems.length && !["profile", "energy", "power", "current", "solar_panel_power"].includes(method)) warnings.push("هیچ تجهیزی انتخاب نشده؛ محاسبه فعلاً بر اساس سناریوی آماده انجام می‌شود.");
  if (surgePowerW > totalPowerW * 2.5) warnings.push("توان راه‌اندازی بالا است؛ اینورتر باید برای پیک استارت بررسی شود.");
  if (selectedItems.some((item) => item.isMotor && !item.hasSoftStarter)) warnings.push("برای تجهیزات موتوری بدون سافت‌استارتر، جریان راه‌اندازی ۲.۵ برابر جریان نامی لحاظ شده است.");
  if (domain === "solar" && totalEnergyWh > 25000) warnings.push("انرژی روزانه بالا است؛ فضای نصب پنل و باتری باید دقیق کنترل شود.");
  if (domain === "emergency" && totalPowerW > 8000) warnings.push("توان اضطراری سنگین است؛ بررسی سه‌فاز یا ژنراتور کمکی پیشنهاد می‌شود.");
  if (totalPowerW > 30000) warnings.push("توان مسیر از ۳۰kW عبور کرده است؛ بلوک چنداینورتری/نیروگاهی در پیکربندی سیستم فعال می‌شود.");
  return warnings;
}

export function persistLoadEngineResult(payload) {
  const result = runLoadEngine(payload);
  localStorage.setItem("shil:loadCalculationDraft", JSON.stringify(result));
  localStorage.setItem("shil:calculationMethod", result.method);
  localStorage.setItem("shil:equipmentDraft", JSON.stringify({
    selectedItems: result.selectedItems,
    totalPowerW: result.totalPowerW,
    totalDailyWh: result.totalEnergyWh,
    totalCurrentA: result.totalCurrentA,
    voltageAC: result.voltageAC,
    phaseAC: result.phaseAC,
    startCurrentA: result.startCurrentA,
    surgePowerW: result.surgePowerW,
    expertSummary: result.expertSummary,
  }));
  return result;
}
