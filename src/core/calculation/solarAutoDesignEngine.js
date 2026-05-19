import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";
import { runSolarSizing } from "./solarSizingEngine.js";
import { runSolarProfessionalDiagnostics } from "./solarDiagnosticEngine.js";
import { runSolarPanelPowerEngine } from "./solarPanelPowerEngine.js";
import { runSystemScaleEngine } from "./systemScaleEngine.js";
import { runUtilityElectricalEngine } from "./utilityElectricalEngine.js";
import { runEnterpriseUtilityEngineeringEngine } from "./enterpriseUtilityEngineeringEngine.js";

const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 2) => Number((num(value, 0)).toFixed(digits));
const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));
const pickById = (items, id) => items.find((item) => item.id === id);

const PERSIAN_SYSTEM_LABEL = {
  offgrid: "آفگرید",
  ongrid: "آنگرید",
  hybrid: "هیبرید"
};

function normalizeLoad(load = {}) {
  const selected = Array.isArray(load.selectedEquipment) ? load.selectedEquipment : [];
  const equipmentPowerW = selected.reduce((sum, item) => sum + num(item.powerW ?? item.watt, 0) * num(item.quantity, 1), 0);
  const equipmentEnergyWh = selected.reduce((sum, item) => {
    const power = num(item.powerW ?? item.watt, 0) * num(item.quantity, 1);
    const hours = num(item.hoursPerDay ?? item.dailyHours ?? item.hours, 0);
    return sum + power * hours;
  }, 0);
  const motorSurgeW = selected.reduce((sum, item) => {
    const power = num(item.powerW ?? item.watt, 0) * num(item.quantity, 1);
    const factor = item.isMotor || item.motor ? (item.softStarter ? 1.2 : 2.5) : 1.15;
    return sum + power * factor;
  }, 0);
  const totalPowerW = num(load.totalPowerW ?? load.designPowerW ?? load.powerW, equipmentPowerW || 3000);
  const surgePowerW = num(load.surgePowerW ?? load.startupPowerW, motorSurgeW || totalPowerW * 1.35);
  const totalEnergyWh = num(load.totalEnergyWh, 0) || num(load.totalEnergyKWh, 0) * 1000 || num(load.dailyEnergy, 0) * 1000 || equipmentEnergyWh || 12000;
  return {
    selected,
    totalPowerW: Math.max(0, totalPowerW),
    surgePowerW: Math.max(totalPowerW, surgePowerW),
    totalEnergyWh: Math.max(0, totalEnergyWh)
  };
}

function normalizeEnvironment(environment = {}) {
  const psh = clamp(num(environment.peakSunHours ?? environment.peakSunHour ?? environment.sunHours, 5.2), 2.5, 7.5);
  const minTempC = num(environment.temperatureMinC ?? environment.minTempC, -5);
  const maxTempC = num(environment.temperatureMaxC ?? environment.maxTempC, 45);
  const thermalLossPercent = clamp(num(environment.temperatureDerating ?? environment.environmentAssessment?.thermalDeratingPercent, 8), 0, 22);
  const soilingLossPercent = clamp(num(environment.soilingLossPercent ?? environment.environmentAssessment?.soilingLossPercent, 5), 0, 18);
  const shadingLossPercent = clamp(num(environment.shadingLossPercent ?? environment.environmentAssessment?.shadingLossPercent, 0), 0, 35);
  const wiringLossPercent = clamp(num(environment.wiringLossPercent, 3), 1, 6);
  const availabilityLossPercent = 2;
  const effectiveEfficiency = clamp(1 - (thermalLossPercent + soilingLossPercent + shadingLossPercent + wiringLossPercent + availabilityLossPercent) / 100, 0.52, 0.88);
  return { psh, minTempC, maxTempC, thermalLossPercent, soilingLossPercent, shadingLossPercent, wiringLossPercent, availabilityLossPercent, effectiveEfficiency };
}

function choosePanel(panelId, panelPowerW) {
  const manual = pickById(SHIL_SOLAR_PANELS, panelId);
  if (manual) return { panel: manual, manual: true };
  const target = num(panelPowerW, 620);
  const panel = [...SHIL_SOLAR_PANELS].sort((a, b) => Math.abs(a.powerW - target) - Math.abs(b.powerW - target))[0] || SHIL_SOLAR_PANELS.find((p) => p.powerW === 620) || SHIL_SOLAR_PANELS.at(-1);
  return { panel, manual: target !== 620 };
}

function chooseSystemVoltage(designPowerW, requestedType, manualVoltage) {
  if (manualVoltage) return num(manualVoltage, 48);
  if (requestedType === "ongrid") return 48;
  if (designPowerW <= 1800) return 12;
  if (designPowerW <= 4200) return 24;
  return 48;
}

function chooseInverter(requiredPowerW, requiredSurgeW, systemVoltage, inverterId, systemType) {
  const manual = pickById(SHIL_SOLAR_INVERTERS, inverterId);
  if (manual) return { inverter: manual, count: 1, manual: true, parallelRequired: false };
  const byVoltage = SHIL_SOLAR_INVERTERS.filter((item) => item.dcVoltage === systemVoltage);
  const pool = (byVoltage.length ? byVoltage : SHIL_SOLAR_INVERTERS).sort((a, b) => a.ratedPowerW - b.ratedPowerW);
  const headroom = systemType === "ongrid" ? 1.05 : systemType === "hybrid" ? 1.15 : 1.2;
  const direct = pool.find((item) => item.ratedPowerW >= requiredPowerW * headroom && item.surgePowerW >= requiredSurgeW);
  if (direct) return { inverter: direct, count: 1, manual: false, parallelRequired: false };
  const largest = pool.at(-1);
  const count = ceil(Math.max((requiredPowerW * headroom) / largest.ratedPowerW, requiredSurgeW / largest.surgePowerW));
  return { inverter: largest, count, manual: false, parallelRequired: count > 1 };
}

function chooseBattery(systemVoltage, requiredUsableWh, preferredBatteryVoltage, batteryId) {
  const manual = pickById(SHIL_LITHIUM_BATTERIES, batteryId);
  const candidates = SHIL_LITHIUM_BATTERIES
    .filter((item) => systemVoltage % item.nominalVoltage === 0)
    .sort((a, b) => b.energyWh - a.energyWh || b.capacityAh - a.capacityAh);
  const preferred = preferredBatteryVoltage ? candidates.find((item) => item.nominalVoltage === num(preferredBatteryVoltage, 0)) : null;
  const battery = manual || preferred || candidates[0] || SHIL_LITHIUM_BATTERIES.at(-1);
  const seriesCount = Math.max(1, Math.round(systemVoltage / battery.nominalVoltage));
  const usableStringWh = battery.nominalVoltage * battery.capacityAh * battery.usableDod * battery.efficiency * seriesCount;
  const parallelCount = ceil(requiredUsableWh / usableStringWh);
  const totalCount = seriesCount * parallelCount;
  const grossEnergyWh = battery.nominalVoltage * battery.capacityAh * seriesCount * parallelCount;
  const usableEnergyWh = round(usableStringWh * parallelCount, 0);
  return {
    battery,
    seriesCount,
    parallelCount,
    totalCount,
    bankVoltageV: battery.nominalVoltage * seriesCount,
    nominalBankVoltage: battery.nominalVoltage * seriesCount,
    grossEnergyWh,
    usableEnergyWh,
    voltageRange: `${battery.minVoltage * seriesCount} تا ${battery.maxVoltage * seriesCount} ولت`,
    stringUsableWh: round(usableStringWh, 0),
    manual: Boolean(manual)
  };
}


function enrichBatteryBankInfo(bank, protection = {}) {
  const unitVoltageV = num(bank?.battery?.nominalVoltage ?? bank?.battery?.voltageV, 0);
  const unitCapacityAh = num(bank?.battery?.capacityAh, 0);
  const seriesCount = Math.max(1, num(bank?.seriesCount, 1));
  const parallelCount = Math.max(1, num(bank?.parallelCount, 1));
  const totalCount = Math.max(0, num(bank?.totalCount, seriesCount * parallelCount));
  const bankVoltageV = num(bank?.bankVoltageV, unitVoltageV * seriesCount);
  const installedAh = unitCapacityAh * parallelCount;
  const unitEnergyKWh = round((unitVoltageV * unitCapacityAh) / 1000, 2);
  const grossEnergyKWh = round(num(bank?.grossEnergyWh, bankVoltageV * installedAh) / 1000, 2);
  const usableEnergyKWh = round(num(bank?.usableEnergyWh, 0) / 1000, 2);
  const branchCurrentA = round(num(protection?.batteryBranchCurrentA, 0), 1);
  return {
    ...bank,
    voltageV: unitVoltageV,
    capacityAh: unitCapacityAh,
    unitVoltageV,
    unitCapacityAh,
    unitEnergyKWh,
    totalCount,
    seriesCount,
    parallelCount,
    bankVoltageV,
    installedAh,
    bankCurrentAh: installedAh,
    grossEnergyKWh,
    usableEnergyKWh,
    branchCurrentA,
    summaryLabel: `${totalCount.toLocaleString("fa-IR")} عدد / ${unitVoltageV}V / ${unitCapacityAh}Ah / ${unitEnergyKWh}kWh هر باتری / ${grossEnergyKWh}kWh کل`,
    engineeringLabel: `${seriesCount.toLocaleString("fa-IR")} سری × ${parallelCount.toLocaleString("fa-IR")} موازی / ولتاژ بانک ${bankVoltageV}V / ظرفیت ${installedAh.toLocaleString("fa-IR")}Ah`
  };
}

function sizePvArray({ dailyWh, autonomyDays, panel, inverter, env, manualPanelCount, panelExtraFactor, targetPvPowerW = 0 }) {
  const dailyProductionNeedWh = dailyWh * (autonomyDays > 1 ? 1.06 : 1);
  const energyBasedPvW = dailyProductionNeedWh / Math.max(1, env.psh) / Math.max(0.52, env.effectiveEfficiency);
  const requiredPvW = Math.max(energyBasedPvW, num(targetPvPowerW, 0));
  const basePanelCount = manualPanelCount ? ceil(manualPanelCount) : ceil(requiredPvW / panel.powerW);
  const reservedPanelCount = ceil(basePanelCount * Math.max(1, num(panelExtraFactor, 1)));

  const tempRiseVocFactor = 1 + Math.max(0, 25 - env.minTempC) * 0.0028;
  const coldVoc = panel.voc * tempRiseVocFactor;
  const hotVmp = panel.vmp * (1 - Math.max(0, env.maxTempC - 25) * 0.0035);
  const minSeries = ceil(inverter.mpptMinV / Math.max(1, hotVmp));
  const maxSeriesByMppt = Math.max(minSeries, Math.floor(inverter.mpptMaxV / Math.max(1, coldVoc)));
  const maxSeriesByDc = inverter.maxDcVoltage ? Math.max(minSeries, Math.floor(inverter.maxDcVoltage / Math.max(1, coldVoc))) : maxSeriesByMppt;
  const maxSeries = Math.max(minSeries, Math.min(maxSeriesByMppt, maxSeriesByDc));
  const targetSeries = clamp(Math.round(((inverter.mpptMinV + inverter.mpptMaxV) / 2) / Math.max(1, panel.vmp)), minSeries, maxSeries);
  const parallelCount = ceil(reservedPanelCount / targetSeries);
  const panelCount = targetSeries * parallelCount;
  return {
    requiredPvW: round(requiredPvW, 0),
    basePanelCount,
    panelCount,
    seriesCount: targetSeries,
    parallelCount,
    arrayPowerW: panelCount * panel.powerW,
    stringVmp: round(targetSeries * panel.vmp, 1),
    stringVoc: round(targetSeries * panel.voc, 1),
    coldStringVoc: round(targetSeries * coldVoc, 1),
    hotStringVmp: round(targetSeries * hotVmp, 1),
    stringCurrentA: round(panel.imp, 2),
    totalCurrentA: round(panel.imp * parallelCount, 2),
    areaM2: round(panelCount * (panel.areaM2 || 2.6), 1),
    maintenanceAreaM2: round(panelCount * (panel.areaM2 || 2.6) * 1.25, 1),
    manual: Boolean(manualPanelCount)
  };
}

function cableByCurrent(currentA, dc = true) {
  if (currentA > 220) return dc ? "95mm² یا باس‌بار طراحی‌شده" : "70mm²";
  if (currentA > 160) return "70mm²";
  if (currentA > 120) return "50mm²";
  if (currentA > 80) return "35mm²";
  if (currentA > 50) return "25mm²";
  if (currentA > 32) return "16mm²";
  if (currentA > 20) return "10mm²";
  return dc ? "6mm²" : "4mm²";
}

function sizeProtection({ designPowerW, inverter, inverterCount, pvArray, batteryDesign }) {
  const dcCurrentA = designPowerW / Math.max(12, inverter.dcVoltage) / 0.92;
  const acCurrentA = designPowerW / 220 / 0.9;
  const batteryBranchCurrentA = dcCurrentA / Math.max(1, batteryDesign.parallelCount);
  const pvFuseA = Math.ceil(pvArray.stringCurrentA * 1.56 / 5) * 5;
  const dcBreakerA = Math.ceil(dcCurrentA * 1.25 / 10) * 10;
  const acBreakerA = Math.ceil(acCurrentA * 1.25 / 10) * 10;
  return {
    dcCurrentA: round(dcCurrentA, 1),
    acCurrentA: round(acCurrentA, 1),
    batteryBranchCurrentA: round(batteryBranchCurrentA, 1),
    dcCable: cableByCurrent(dcCurrentA, true),
    acCable: cableByCurrent(acCurrentA, false),
    batteryCable: cableByCurrent(batteryBranchCurrentA, true),
    pvCable: pvArray.totalCurrentA > 45 ? "10mm²" : "6mm²",
    pvFuseA,
    dcBreakerA,
    acBreakerA,
    inverterParallel: inverterCount,
    protectionItems: SHIL_SOLAR_PROTECTION_BANK,
    report: [
      `جریان DC اینورتر حدود ${round(dcCurrentA, 1)} آمپر است؛ کابل ${cableByCurrent(dcCurrentA, true)} با درنظرگرفتن جریان و افت ولتاژ پیشنهاد شد.`,
      `جریان AC خروجی حدود ${round(acCurrentA, 1)} آمپر است؛ بریکر ${acBreakerA} آمپر و کابل ${cableByCurrent(acCurrentA, false)} برای خروجی پیشنهاد شد.`,
      `فیوز هر رشته پنل ${pvFuseA} آمپر است؛ مقدار بر اساس ضریب 1.56 جریان پنل انتخاب شد.`,
      `کابل باتری بر اساس جریان شاخه باتری ${round(batteryBranchCurrentA, 1)} آمپر انتخاب شد.`
    ]
  };
}

function buildValidation({ load, designPowerW, designSurgeW, inverter, inverterCount, battery, requiredBatteryWh, pvArray, env }) {
  const checks = [];
  const push = (key, ok, level, message, fix = "") => checks.push({ key, ok, level: ok ? "ok" : level, message, fix });
  push("load", load.totalPowerW > 0 && load.totalEnergyWh > 0, "error", "اطلاعات توان و انرژی مصرفی معتبر است.", "روش محاسبه بار را تکمیل کنید.");
  push("inverter-power", inverter.ratedPowerW * inverterCount >= designPowerW, "error", "توان نامی اینورتر توان طراحی را پوشش می‌دهد.", "مدل بالاتر یا تعداد اینورتر بیشتر انتخاب شود.");
  push("inverter-surge", inverter.surgePowerW * inverterCount >= designSurgeW, "warning", "توان لحظه‌ای اینورتر برای راه‌اندازی بارها کافی است.", "بار موتوری یا سافت‌استارتر را بازبینی کنید.");
  push("battery-energy", battery.usableEnergyWh >= requiredBatteryWh, "error", "ظرفیت قابل استفاده باتری انرژی مورد نیاز را پوشش می‌دهد.", "تعداد موازی باتری افزایش یابد.");
  push("battery-voltage", battery.bankVoltageV >= inverter.batteryMinVoltage && battery.bankVoltageV <= inverter.batteryMaxVoltage, "error", "ولتاژ بانک باتری با ورودی اینورتر سازگار است.", "آرایش سری باتری اصلاح شود.");
  push("mppt-vmp", pvArray.hotStringVmp >= inverter.mpptMinV && pvArray.stringVmp <= inverter.mpptMaxV, "warning", "ولتاژ کاری رشته پنل داخل محدوده MPPT است.", "تعداد سری پنل اصلاح شود.");
  push("mppt-voc", pvArray.coldStringVoc <= (inverter.maxDcVoltage || inverter.mpptMaxV), "error", "ولتاژ مدار باز سرد پنل از سقف مجاز DC عبور نمی‌کند.", "تعداد سری پنل کاهش یابد.");
  push("pv-power", pvArray.arrayPowerW <= inverter.maxPvPowerW * inverterCount, "warning", "توان آرایه پنل با سقف ورودی PV اینورتر سازگار است.", "مدل اینورتر یا تعداد ورودی MPPT بازبینی شود.");
  push("climate", env.effectiveEfficiency >= 0.55, "warning", "تلفات محیطی در بازه قابل طراحی است.", "سایه‌اندازی، دما یا آلودگی سطح پنل بازبینی شود.");
  const errors = checks.filter((c) => c.level === "error" && !c.ok).map((c) => c.fix || c.message);
  const warnings = checks.filter((c) => c.level === "warning" && !c.ok).map((c) => c.fix || c.message);
  return { checks, errors, warnings };
}

export function runSolarAutoDesign({ load = {}, environment = {}, settings = {} } = {}) {
  const normalized = normalizeLoad(load);
  const env = normalizeEnvironment(environment);
  const systemType = settings.systemType || "offgrid";
  const autonomyDays = clamp(settings.autonomyDays, 0.5, 5) || 1;
  const reserveFactor = clamp(settings.reserveFactor, 1, 1.8) || 1.2;
  const requestedPlantPowerW = Math.max(
    num(settings.targetPlantPowerMW, 0) * 1_000_000,
    num(settings.targetPlantPowerKW, 0) * 1000,
    num(settings.targetDesignPowerW, 0)
  );
  const designPowerW = Math.ceil(Math.min(30_000_000, Math.max(normalized.totalPowerW * reserveFactor, requestedPlantPowerW)));
  const designSurgeW = Math.ceil(Math.max(normalized.surgePowerW * (systemType === "ongrid" ? 1 : 1.05), designPowerW * (systemType === "ongrid" ? 1.02 : 1.08)));
  const systemVoltage = chooseSystemVoltage(designPowerW, systemType, settings.systemVoltage);
  const inverterPick = chooseInverter(designPowerW, designSurgeW, systemVoltage, settings.inverterId, systemType);
  const scalePreview = runSystemScaleEngine({ designPowerW, inverter: inverterPick.inverter, inverterCount: inverterPick.count, settings });
  const inverterBaseCount = Math.max(1, num(settings.inverterCount, scalePreview.totalInverterCount || inverterPick.count));
  const inverterCount = Math.max(scalePreview.totalInverterCount || inverterPick.count, ceil(inverterBaseCount * Math.max(1, num(settings.inverterExtraFactor, 1))));
  const systemScale = runSystemScaleEngine({ designPowerW, inverter: inverterPick.inverter, inverterCount, settings });
  const { panel, manual: panelManual } = choosePanel(settings.panelId, settings.panelPowerW || 620);
  const requiredBatteryWh = systemType === "ongrid" ? 0 : Math.ceil(normalized.totalEnergyWh * autonomyDays / 0.94);
  const batteryDesign = chooseBattery(inverterPick.inverter.dcVoltage, Math.max(1, requiredBatteryWh), settings.batteryVoltage, settings.batteryId);
  const batteryBaseCount = Math.max(batteryDesign.totalCount, num(settings.batteryCount, batteryDesign.totalCount));
  const batteryTotalCount = Math.max(batteryDesign.totalCount, ceil(batteryBaseCount * Math.max(1, num(settings.batteryExtraFactor, 1))));
  const pvArray = sizePvArray({ dailyWh: normalized.totalEnergyWh, autonomyDays, panel, inverter: inverterPick.inverter, env, manualPanelCount: settings.panelCount, panelExtraFactor: settings.panelExtraFactor, targetPvPowerW: systemScale.targetDcPowerW });
  const batteryFinal = { ...batteryDesign, totalCount: batteryTotalCount, parallelCount: Math.max(batteryDesign.parallelCount, Math.ceil(batteryTotalCount / Math.max(1, batteryDesign.seriesCount))) };
  batteryFinal.usableEnergyWh = round(batteryDesign.stringUsableWh * batteryFinal.parallelCount, 0);
  batteryFinal.grossEnergyWh = batteryFinal.bankVoltageV * batteryFinal.battery.capacityAh * batteryFinal.parallelCount;
  const solarSizing = runSolarSizing({
    panelPowerW: panel.powerW,
    panelCount: pvArray.panelCount,
    peakSunHours: env.psh,
    systemLossRatio: 1 - env.effectiveEfficiency,
    dailyLoadWh: normalized.totalEnergyWh,
    autonomyDays,
    depthOfDischarge: batteryFinal.battery.usableDod || 0.9,
    efficiency: batteryFinal.battery.efficiency || 0.94,
    batteryUnitKWh: (batteryFinal.battery.energyWh || (batteryFinal.battery.nominalVoltage * batteryFinal.battery.capacityAh)) / 1000,
    batteryUnitVoltageV: batteryFinal.battery.nominalVoltage,
    batteryUnitCapacityAh: batteryFinal.battery.capacityAh
  });
  const panelPowerAnalysis = runSolarPanelPowerEngine({
    panel,
    pvArray,
    inverter: inverterPick.inverter,
    inverterCount,
    env,
    load: normalized,
    solarSizing,
    settings
  });
  const utilityElectrical = runUtilityElectricalEngine({
    systemScale,
    pvArray,
    inverter: inverterPick.inverter,
    inverterCount,
    env,
    settings
  });
  const enterpriseUtility = runEnterpriseUtilityEngineeringEngine({
    utilityElectrical,
    systemScale,
    env,
    settings
  });
  const protection = sizeProtection({ designPowerW, inverter: inverterPick.inverter, inverterCount, pvArray, batteryDesign: batteryFinal });
  const batteryReport = enrichBatteryBankInfo(batteryFinal, protection);
  const validation = buildValidation({ load: normalized, designPowerW, designSurgeW, inverter: inverterPick.inverter, inverterCount, battery: batteryReport, requiredBatteryWh, pvArray, env });
  const diagnostics = runSolarProfessionalDiagnostics({
    load: normalized,
    env,
    settings: { autonomyDays, systemType },
    design: { designPowerW, designSurgeW, requiredBatteryWh, systemVoltage, requestedPlantPowerW },
    panel,
    inverter: inverterPick.inverter,
    inverterCount,
    pvArray,
    battery: batteryReport,
    protection,
    solarSizing,
    validation,
    panelPowerAnalysis,
    systemScale,
    utilityElectrical,
    enterpriseUtility
  });
  const confidence = clamp(Math.min(diagnostics.score, 100 - validation.errors.length * 18 - validation.warnings.length * 6), 20, 100);

  const explanations = [
    `مسیر طراحی ${PERSIAN_SYSTEM_LABEL[systemType] || "خورشیدی"} با توان طراحی ${designPowerW} وات و ضریب اطمینان ${reserveFactor} محاسبه شد.`,
    `مقیاس پروژه ${systemScale.scaleLabel} است و روش تحلیل ${systemScale.designModeLabel} انتخاب شد.`,
    `پنل پیش‌فرض ${panel.powerW} وات است؛ اگر کاربر 700 وات را دستی انتخاب کند، تعداد و آرایش پنل با همان مقدار دوباره محاسبه می‌شود.`,
    `آرایش پنل ${pvArray.seriesCount} سری × ${pvArray.parallelCount} موازی انتخاب شد تا Vmp و Voc در بازه مجاز MPPT و ولتاژ DC بمانند.`,
    `باتری ${batteryReport.summaryLabel} با آرایش ${batteryReport.engineeringLabel} انتخاب شد تا ولتاژ بانک و انرژی قابل استفاده پروژه تأمین شود.`,
    `ضرایب توسعه آینده روی تعداد نهایی تجهیزات اعمال شده‌اند: پنل ${num(settings.panelExtraFactor, 1)}، اینورتر ${num(settings.inverterExtraFactor, 1)}، باتری ${num(settings.batteryExtraFactor, 1)}.`
  ];

  return {
    valid: validation.errors.length === 0,
    method: "solar-engineering-logic-100",
    confidence,
    label: PERSIAN_SYSTEM_LABEL[systemType] || "خورشیدی",
    load: normalized,
    design: { designPowerW, designSurgeW, requiredBatteryWh, systemVoltage, requestedPlantPowerW },
    settings: {
      autonomyDays,
      reserveFactor,
      systemType,
      manual: Boolean(settings.manualMode),
      equipmentManual: Boolean(settings.equipmentManualMode || panelManual || inverterPick.manual || batteryDesign.manual),
      parameterManual: Boolean(settings.parameterManualMode),
      panelExtraFactor: num(settings.panelExtraFactor, 1),
      inverterExtraFactor: num(settings.inverterExtraFactor, 1),
      batteryExtraFactor: num(settings.batteryExtraFactor, 1),
      projectScale: settings.projectScale || "auto",
      targetPlantPowerMW: num(settings.targetPlantPowerMW, 0),
      targetPlantPowerKW: num(settings.targetPlantPowerKW, 0),
      powerBlockSizeKW: num(settings.powerBlockSizeKW, 0),
      mvVoltageKV: num(settings.mvVoltageKV, 0),
      blockStationMW: num(settings.blockStationMW, 0),
      exportLimitMW: num(settings.exportLimitMW, 0),
      groundCoverageRatio: num(settings.groundCoverageRatio, 0),
      trackerMode: settings.trackerMode || "auto",
      terrainSlopeDeg: num(settings.terrainSlopeDeg, 0),
      usableLandPercent: num(settings.usableLandPercent, 0),
      gridShortCircuitMVA: num(settings.gridShortCircuitMVA, 0),
      estimatedMvFaultKA: num(settings.estimatedMvFaultKA, 0),
      plantAvailabilityPercent: num(settings.plantAvailabilityPercent, 0),
      annualDegradationPercent: num(settings.annualDegradationPercent, 0)
    },
    inverter: { ...inverterPick.inverter, count: inverterCount, parallelRequired: inverterCount > 1, manual: inverterPick.manual },
    panel,
    pvArray,
    solarSizing,
    panelPowerAnalysis,
    systemScale,
    utilityElectrical,
    enterpriseUtility,
    battery: batteryReport,
    protection,
    space: {
      panelAreaM2: pvArray.areaM2,
      maintenanceAreaM2: pvArray.maintenanceAreaM2,
      note: "فضا شامل سطح پنل‌ها به‌علاوه حدود 25٪ مسیر دسترسی، فاصله سرویس و نگهداری است."
    },
    losses: env,
    validation,
    diagnostics,
    warnings: [...systemScale.warnings, ...validation.warnings, ...utilityElectrical.checks.filter((item) => item.level === "warning" && !item.ok).map((item) => item.message), ...enterpriseUtility.checks.filter((item) => item.level === "warning" && !item.ok).map((item) => item.message), ...panelPowerAnalysis.checks.filter((item) => item.level === "warning" && !item.ok).map((item) => item.message), ...diagnostics.items.filter((item) => item.severity === "warning").map((item) => item.message)],
    errors: [...validation.errors, ...utilityElectrical.checks.filter((item) => item.level === "error" && !item.ok).map((item) => item.message), ...enterpriseUtility.checks.filter((item) => item.level === "error" && !item.ok).map((item) => item.message), ...panelPowerAnalysis.checks.filter((item) => item.level === "error" && !item.ok).map((item) => item.message), ...diagnostics.items.filter((item) => ["critical", "error"].includes(item.severity)).map((item) => item.message)],
    explanations: [...explanations, ...systemScale.engineeringNotes, ...utilityElectrical.recommendations, ...enterpriseUtility.recommendations],
    equipmentSchedule: [
      { group: "پنل خورشیدی", qty: pvArray.panelCount, spec: `${panel.powerW}W / ${panel.type}`, reason: "تأمین انرژی روزانه و تطابق با محدوده MPPT" },
      { group: systemScale.designMode === "block_based_power_plant" ? "بلوک نیروگاهی / اینورتر" : "اینورتر خورشیدی", qty: inverterCount, spec: `${inverterPick.inverter.ratedPowerW}W / ${inverterPick.inverter.dcVoltage}V`, reason: "پوشش توان دائم و توان لحظه‌ای" },
      { group: "باتری", qty: batteryReport.totalCount, spec: `${batteryReport.unitVoltageV}V / ${batteryReport.unitCapacityAh}Ah / ${batteryReport.unitEnergyKWh}kWh هر باتری / ${batteryReport.grossEnergyKWh}kWh کل`, reason: `${batteryReport.seriesCount} سری × ${batteryReport.parallelCount} موازی / جریان بانک ${batteryReport.bankCurrentAh}Ah` },
      { group: "حفاظت", qty: 1, spec: `DC ${protection.dcBreakerA}A / AC ${protection.acBreakerA}A`, reason: "حفاظت خروجی، باتری، پنل، ارتینگ و سرج" }
    ],
    banks: { inverters: SHIL_SOLAR_INVERTERS, batteries: SHIL_LITHIUM_BATTERIES, panels: SHIL_SOLAR_PANELS },
    nextBlockedReason: validation.errors[0] || ""
  };
}
