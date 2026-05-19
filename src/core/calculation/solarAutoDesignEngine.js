import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[Û°-Û¹]/g, (d) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(d)).replace(/[Ù -Ù©]/g, (d) => "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 2) => Number((num(value, 0)).toFixed(digits));
const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));
const pickById = (items, id) => items.find((item) => item.id === id);

const PERSIAN_SYSTEM_LABEL = {
  offgrid: "Ø¢ÙÚ¯Ø±ÛŒØ¯",
  ongrid: "Ø¢Ù†Ú¯Ø±ÛŒØ¯",
  hybrid: "Ù‡ÛŒØ¨Ø±ÛŒØ¯"
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
    voltageRange: `${battery.minVoltage * seriesCount} ØªØ§ ${battery.maxVoltage * seriesCount} ÙˆÙ„Øª`,
    stringUsableWh: round(usableStringWh, 0),
    manual: Boolean(manual)
  };
}

function sizePvArray({ dailyWh, autonomyDays, panel, inverter, env, manualPanelCount, panelExtraFactor }) {
  const dailyProductionNeedWh = dailyWh * (autonomyDays > 1 ? 1.06 : 1);
  const requiredPvW = dailyProductionNeedWh / Math.max(1, env.psh) / Math.max(0.52, env.effectiveEfficiency);
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
  if (currentA > 220) return dc ? "95mmÂ² ÛŒØ§ Ø¨Ø§Ø³â€ŒØ¨Ø§Ø± Ø·Ø±Ø§Ø­ÛŒâ€ŒØ´Ø¯Ù‡" : "70mmÂ²";
  if (currentA > 160) return "70mmÂ²";
  if (currentA > 120) return "50mmÂ²";
  if (currentA > 80) return "35mmÂ²";
  if (currentA > 50) return "25mmÂ²";
  if (currentA > 32) return "16mmÂ²";
  if (currentA > 20) return "10mmÂ²";
  return dc ? "6mmÂ²" : "4mmÂ²";
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
    pvCable: pvArray.totalCurrentA > 45 ? "10mmÂ²" : "6mmÂ²",
    pvFuseA,
    dcBreakerA,
    acBreakerA,
    inverterParallel: inverterCount,
    protectionItems: SHIL_SOLAR_PROTECTION_BANK,
    report: [
      `Ø¬Ø±ÛŒØ§Ù† DC Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø­Ø¯ÙˆØ¯ ${round(dcCurrentA, 1)} Ø¢Ù…Ù¾Ø± Ø§Ø³ØªØ› Ú©Ø§Ø¨Ù„ ${cableByCurrent(dcCurrentA, true)} Ø¨Ø§ Ø¯Ø±Ù†Ø¸Ø±Ú¯Ø±ÙØªÙ† Ø¬Ø±ÛŒØ§Ù† Ùˆ Ø§ÙØª ÙˆÙ„ØªØ§Ú˜ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø´Ø¯.`,
      `Ø¬Ø±ÛŒØ§Ù† AC Ø®Ø±ÙˆØ¬ÛŒ Ø­Ø¯ÙˆØ¯ ${round(acCurrentA, 1)} Ø¢Ù…Ù¾Ø± Ø§Ø³ØªØ› Ø¨Ø±ÛŒÚ©Ø± ${acBreakerA} Ø¢Ù…Ù¾Ø± Ùˆ Ú©Ø§Ø¨Ù„ ${cableByCurrent(acCurrentA, false)} Ø¨Ø±Ø§ÛŒ Ø®Ø±ÙˆØ¬ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø´Ø¯.`,
      `ÙÛŒÙˆØ² Ù‡Ø± Ø±Ø´ØªÙ‡ Ù¾Ù†Ù„ ${pvFuseA} Ø¢Ù…Ù¾Ø± Ø§Ø³ØªØ› Ù…Ù‚Ø¯Ø§Ø± Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¶Ø±ÛŒØ¨ 1.56 Ø¬Ø±ÛŒØ§Ù† Ù¾Ù†Ù„ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯.`,
      `Ú©Ø§Ø¨Ù„ Ø¨Ø§ØªØ±ÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¬Ø±ÛŒØ§Ù† Ø´Ø§Ø®Ù‡ Ø¨Ø§ØªØ±ÛŒ ${round(batteryBranchCurrentA, 1)} Ø¢Ù…Ù¾Ø± Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯.`
    ]
  };
}

function buildValidation({ load, designPowerW, designSurgeW, inverter, inverterCount, battery, requiredBatteryWh, pvArray, env }) {
  const checks = [];
  const push = (key, ok, level, message, fix = "") => checks.push({ key, ok, level: ok ? "ok" : level, message, fix });
  push("load", load.totalPowerW > 0 && load.totalEnergyWh > 0, "error", "Ø§Ø·Ù„Ø§Ø¹Ø§Øª ØªÙˆØ§Ù† Ùˆ Ø§Ù†Ø±Ú˜ÛŒ Ù…ØµØ±ÙÛŒ Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª.", "Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø¨Ø§Ø± Ø±Ø§ ØªÚ©Ù…ÛŒÙ„ Ú©Ù†ÛŒØ¯.");
  push("inverter-power", inverter.ratedPowerW * inverterCount >= designPowerW, "error", "ØªÙˆØ§Ù† Ù†Ø§Ù…ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ Ø±Ø§ Ù¾ÙˆØ´Ø´ Ù…ÛŒâ€ŒØ¯Ù‡Ø¯.", "Ù…Ø¯Ù„ Ø¨Ø§Ù„Ø§ØªØ± ÛŒØ§ ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨ÛŒØ´ØªØ± Ø§Ù†ØªØ®Ø§Ø¨ Ø´ÙˆØ¯.");
  push("inverter-surge", inverter.surgePowerW * inverterCount >= designSurgeW, "warning", "ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ø§ÛŒ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø¨Ø§Ø±Ù‡Ø§ Ú©Ø§ÙÛŒ Ø§Ø³Øª.", "Ø¨Ø§Ø± Ù…ÙˆØªÙˆØ±ÛŒ ÛŒØ§ Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ± Ø±Ø§ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ Ú©Ù†ÛŒØ¯.");
  push("battery-energy", battery.usableEnergyWh >= requiredBatteryWh, "error", "Ø¸Ø±ÙÛŒØª Ù‚Ø§Ø¨Ù„ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø¨Ø§ØªØ±ÛŒ Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø±Ø§ Ù¾ÙˆØ´Ø´ Ù…ÛŒâ€ŒØ¯Ù‡Ø¯.", "ØªØ¹Ø¯Ø§Ø¯ Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø§ØªØ±ÛŒ Ø§ÙØ²Ø§ÛŒØ´ ÛŒØ§Ø¨Ø¯.");
  push("battery-voltage", battery.bankVoltageV >= inverter.batteryMinVoltage && battery.bankVoltageV <= inverter.batteryMaxVoltage, "error", "ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ Ø¨Ø§ ÙˆØ±ÙˆØ¯ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø³Ø§Ø²Ú¯Ø§Ø± Ø§Ø³Øª.", "Ø¢Ø±Ø§ÛŒØ´ Ø³Ø±ÛŒ Ø¨Ø§ØªØ±ÛŒ Ø§ØµÙ„Ø§Ø­ Ø´ÙˆØ¯.");
  push("mppt-vmp", pvArray.hotStringVmp >= inverter.mpptMinV && pvArray.stringVmp <= inverter.mpptMaxV, "warning", "ÙˆÙ„ØªØ§Ú˜ Ú©Ø§Ø±ÛŒ Ø±Ø´ØªÙ‡ Ù¾Ù†Ù„ Ø¯Ø§Ø®Ù„ Ù…Ø­Ø¯ÙˆØ¯Ù‡ MPPT Ø§Ø³Øª.", "ØªØ¹Ø¯Ø§Ø¯ Ø³Ø±ÛŒ Ù¾Ù†Ù„ Ø§ØµÙ„Ø§Ø­ Ø´ÙˆØ¯.");
  push("mppt-voc", pvArray.coldStringVoc <= (inverter.maxDcVoltage || inverter.mpptMaxV), "error", "ÙˆÙ„ØªØ§Ú˜ Ù…Ø¯Ø§Ø± Ø¨Ø§Ø² Ø³Ø±Ø¯ Ù¾Ù†Ù„ Ø§Ø² Ø³Ù‚Ù Ù…Ø¬Ø§Ø² DC Ø¹Ø¨ÙˆØ± Ù†Ù…ÛŒâ€ŒÚ©Ù†Ø¯.", "ØªØ¹Ø¯Ø§Ø¯ Ø³Ø±ÛŒ Ù¾Ù†Ù„ Ú©Ø§Ù‡Ø´ ÛŒØ§Ø¨Ø¯.");
  push("pv-power", pvArray.arrayPowerW <= inverter.maxPvPowerW * inverterCount, "warning", "ØªÙˆØ§Ù† Ø¢Ø±Ø§ÛŒÙ‡ Ù¾Ù†Ù„ Ø¨Ø§ Ø³Ù‚Ù ÙˆØ±ÙˆØ¯ÛŒ PV Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø³Ø§Ø²Ú¯Ø§Ø± Ø§Ø³Øª.", "Ù…Ø¯Ù„ Ø§ÛŒÙ†ÙˆØ±ØªØ± ÛŒØ§ ØªØ¹Ø¯Ø§Ø¯ ÙˆØ±ÙˆØ¯ÛŒ MPPT Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ Ø´ÙˆØ¯.");
  push("climate", env.effectiveEfficiency >= 0.55, "warning", "ØªÙ„ÙØ§Øª Ù…Ø­ÛŒØ·ÛŒ Ø¯Ø± Ø¨Ø§Ø²Ù‡ Ù‚Ø§Ø¨Ù„ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø³Øª.", "Ø³Ø§ÛŒÙ‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒØŒ Ø¯Ù…Ø§ ÛŒØ§ Ø¢Ù„ÙˆØ¯Ú¯ÛŒ Ø³Ø·Ø­ Ù¾Ù†Ù„ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ Ø´ÙˆØ¯.");
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
  const designPowerW = Math.ceil(normalized.totalPowerW * reserveFactor);
  const designSurgeW = Math.ceil(normalized.surgePowerW * (systemType === "ongrid" ? 1 : 1.05));
  const systemVoltage = chooseSystemVoltage(designPowerW, systemType, settings.systemVoltage);
  const inverterPick = chooseInverter(designPowerW, designSurgeW, systemVoltage, settings.inverterId, systemType);
  const inverterBaseCount = Math.max(1, num(settings.inverterCount, inverterPick.count));
  const inverterCount = Math.max(inverterPick.count, ceil(inverterBaseCount * Math.max(1, num(settings.inverterExtraFactor, 1))));
  const { panel, manual: panelManual } = choosePanel(settings.panelId, settings.panelPowerW || 620);
  const requiredBatteryWh = systemType === "ongrid" ? 0 : Math.ceil(normalized.totalEnergyWh * autonomyDays / 0.94);
  const batteryDesign = chooseBattery(inverterPick.inverter.dcVoltage, Math.max(1, requiredBatteryWh), settings.batteryVoltage, settings.batteryId);
  const batteryBaseCount = Math.max(batteryDesign.totalCount, num(settings.batteryCount, batteryDesign.totalCount));
  const batteryTotalCount = Math.max(batteryDesign.totalCount, ceil(batteryBaseCount * Math.max(1, num(settings.batteryExtraFactor, 1))));
  const pvArray = sizePvArray({ dailyWh: normalized.totalEnergyWh, autonomyDays, panel, inverter: inverterPick.inverter, env, manualPanelCount: settings.panelCount, panelExtraFactor: settings.panelExtraFactor });
  const batteryFinal = { ...batteryDesign, totalCount: batteryTotalCount, parallelCount: Math.max(batteryDesign.parallelCount, Math.ceil(batteryTotalCount / Math.max(1, batteryDesign.seriesCount))) };
  batteryFinal.usableEnergyWh = round(batteryDesign.stringUsableWh * batteryFinal.parallelCount, 0);
  batteryFinal.grossEnergyWh = batteryFinal.bankVoltageV * batteryFinal.battery.capacityAh * batteryFinal.parallelCount;
  const protection = sizeProtection({ designPowerW, inverter: inverterPick.inverter, inverterCount, pvArray, batteryDesign: batteryFinal });
  const validation = buildValidation({ load: normalized, designPowerW, designSurgeW, inverter: inverterPick.inverter, inverterCount, battery: batteryFinal, requiredBatteryWh, pvArray, env });
  const confidence = clamp(100 - validation.errors.length * 24 - validation.warnings.length * 8, 35, 100);

  const explanations = [
    `Ù…Ø³ÛŒØ± Ø·Ø±Ø§Ø­ÛŒ ${PERSIAN_SYSTEM_LABEL[systemType] || "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"} Ø¨Ø§ ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ ${designPowerW} ÙˆØ§Øª Ùˆ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† ${reserveFactor} Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯.`,
    `Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ ${panel.powerW} ÙˆØ§Øª Ø§Ø³ØªØ› Ø§Ú¯Ø± Ú©Ø§Ø±Ø¨Ø± 700 ÙˆØ§Øª Ø±Ø§ Ø¯Ø³ØªÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†Ø¯ØŒ ØªØ¹Ø¯Ø§Ø¯ Ùˆ Ø¢Ø±Ø§ÛŒØ´ Ù¾Ù†Ù„ Ø¨Ø§ Ù‡Ù…Ø§Ù† Ù…Ù‚Ø¯Ø§Ø± Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.`,
    `Ø¢Ø±Ø§ÛŒØ´ Ù¾Ù†Ù„ ${pvArray.seriesCount} Ø³Ø±ÛŒ Ã— ${pvArray.parallelCount} Ù…ÙˆØ§Ø²ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯ ØªØ§ Vmp Ùˆ Voc Ø¯Ø± Ø¨Ø§Ø²Ù‡ Ù…Ø¬Ø§Ø² MPPT Ùˆ ÙˆÙ„ØªØ§Ú˜ DC Ø¨Ù…Ø§Ù†Ù†Ø¯.`,
    `Ø¨Ø§ØªØ±ÛŒ ${batteryFinal.seriesCount} Ø³Ø±ÛŒ Ã— ${batteryFinal.parallelCount} Ù…ÙˆØ§Ø²ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯ ØªØ§ ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ù†Ú© Ùˆ Ø§Ù†Ø±Ú˜ÛŒ Ù‚Ø§Ø¨Ù„ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ ØªØ£Ù…ÛŒÙ† Ø´ÙˆØ¯.`,
    `Ø¶Ø±Ø§ÛŒØ¨ ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡ Ø±ÙˆÛŒ ØªØ¹Ø¯Ø§Ø¯ Ù†Ù‡Ø§ÛŒÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯: Ù¾Ù†Ù„ ${num(settings.panelExtraFactor, 1)}ØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± ${num(settings.inverterExtraFactor, 1)}ØŒ Ø¨Ø§ØªØ±ÛŒ ${num(settings.batteryExtraFactor, 1)}.`
  ];

  return {
    valid: validation.errors.length === 0,
    method: "solar-engineering-logic-100",
    confidence,
    label: PERSIAN_SYSTEM_LABEL[systemType] || "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
    load: normalized,
    design: { designPowerW, designSurgeW, requiredBatteryWh, systemVoltage },
    settings: {
      autonomyDays,
      reserveFactor,
      systemType,
      manual: Boolean(settings.manualMode),
      equipmentManual: Boolean(settings.equipmentManualMode || panelManual || inverterPick.manual || batteryDesign.manual),
      parameterManual: Boolean(settings.parameterManualMode),
      panelExtraFactor: num(settings.panelExtraFactor, 1),
      inverterExtraFactor: num(settings.inverterExtraFactor, 1),
      batteryExtraFactor: num(settings.batteryExtraFactor, 1)
    },
    inverter: { ...inverterPick.inverter, count: inverterCount, parallelRequired: inverterCount > 1, manual: inverterPick.manual },
    panel,
    pvArray,
    battery: batteryFinal,
    protection,
    space: {
      panelAreaM2: pvArray.areaM2,
      maintenanceAreaM2: pvArray.maintenanceAreaM2,
      note: "ÙØ¶Ø§ Ø´Ø§Ù…Ù„ Ø³Ø·Ø­ Ù¾Ù†Ù„â€ŒÙ‡Ø§ Ø¨Ù‡â€ŒØ¹Ù„Ø§ÙˆÙ‡ Ø­Ø¯ÙˆØ¯ 25Ùª Ù…Ø³ÛŒØ± Ø¯Ø³ØªØ±Ø³ÛŒØŒ ÙØ§ØµÙ„Ù‡ Ø³Ø±ÙˆÛŒØ³ Ùˆ Ù†Ú¯Ù‡Ø¯Ø§Ø±ÛŒ Ø§Ø³Øª."
    },
    losses: env,
    validation,
    warnings: validation.warnings,
    errors: validation.errors,
    explanations,
    equipmentSchedule: [
      { group: "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", qty: pvArray.panelCount, spec: `${panel.powerW}W / ${panel.type}`, reason: "ØªØ£Ù…ÛŒÙ† Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡ Ùˆ ØªØ·Ø§Ø¨Ù‚ Ø¨Ø§ Ù…Ø­Ø¯ÙˆØ¯Ù‡ MPPT" },
      { group: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", qty: inverterCount, spec: `${inverterPick.inverter.ratedPowerW}W / ${inverterPick.inverter.dcVoltage}V`, reason: "Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ùˆ ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ" },
      { group: "Ø¨Ø§ØªØ±ÛŒ", qty: batteryFinal.totalCount, spec: `${batteryFinal.battery.nominalVoltage}V ${batteryFinal.battery.capacityAh}Ah`, reason: "ØªØ£Ù…ÛŒÙ† Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ùˆ Ø¸Ø±ÙÛŒØª Ø°Ø®ÛŒØ±Ù‡" },
      { group: "Ø­ÙØ§Ø¸Øª", qty: 1, spec: `DC ${protection.dcBreakerA}A / AC ${protection.acBreakerA}A`, reason: "Ø­ÙØ§Ø¸Øª Ø®Ø±ÙˆØ¬ÛŒØŒ Ø¨Ø§ØªØ±ÛŒØŒ Ù¾Ù†Ù„ØŒ Ø§Ø±ØªÛŒÙ†Ú¯ Ùˆ Ø³Ø±Ø¬" }
    ],
    banks: { inverters: SHIL_SOLAR_INVERTERS, batteries: SHIL_LITHIUM_BATTERIES, panels: SHIL_SOLAR_PANELS },
    nextBlockedReason: validation.errors[0] || ""
  };
}
