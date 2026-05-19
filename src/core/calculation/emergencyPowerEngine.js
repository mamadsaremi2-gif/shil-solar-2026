import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[Û°-Û¹]/g, (d) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(d)).replace(/[Ù -Ù©]/g, (d) => "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 2) => Number((num(value, 0)).toFixed(digits));
const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));

const EMERGENCY_INVERTER_BANK = [
  { id: "emergency-inv-1k-24", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 1 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 24 ÙˆÙ„Øª", ratedPowerW: 1000, surgePowerW: 2000, batteryVoltage: 24, efficiency: 0.9, parallelCapable: false },
  { id: "emergency-inv-2k-24", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 2 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 24 ÙˆÙ„Øª", ratedPowerW: 2000, surgePowerW: 4000, batteryVoltage: 24, efficiency: 0.91, parallelCapable: false },
  { id: "emergency-inv-3k-48", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 3 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 48 ÙˆÙ„Øª", ratedPowerW: 3000, surgePowerW: 6000, batteryVoltage: 48, efficiency: 0.92, parallelCapable: true },
  { id: "emergency-inv-5k-48", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 5 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 48 ÙˆÙ„Øª", ratedPowerW: 5000, surgePowerW: 10000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "emergency-inv-8k-48", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 8 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 48 ÙˆÙ„Øª", ratedPowerW: 8000, surgePowerW: 16000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "emergency-inv-10k-48", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ 10 Ú©ÛŒÙ„ÙˆÙˆØ§Øª / 48 ÙˆÙ„Øª", ratedPowerW: 10000, surgePowerW: 20000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true }
];

function normalizeLoad(load = {}) {
  const selected = Array.isArray(load.selectedEquipment) ? load.selectedEquipment : [];
  const equipmentPowerW = selected.reduce((sum, item) => sum + num(item.powerW ?? item.watt, 0) * num(item.quantity, 1), 0);
  const surgePowerW = selected.reduce((sum, item) => {
    const power = num(item.powerW ?? item.watt, 0) * num(item.quantity, 1);
    const factor = item.isMotor || item.motor ? (item.softStarter ? 1.25 : 2.5) : 1.15;
    return sum + power * factor;
  }, 0);
  const totalPowerW = num(load.totalPowerW ?? load.designPowerW ?? load.powerW, equipmentPowerW || 2500);
  const requiredEmergencyHours = clamp(load.requiredEmergencyHours ?? load.emergencyHours ?? load.backupHours, 0.25, 24) || 2;
  return {
    selected,
    totalPowerW: Math.max(0, totalPowerW),
    surgePowerW: Math.max(totalPowerW, num(load.surgePowerW ?? load.startupPowerW, surgePowerW || totalPowerW * 1.5)),
    requiredEmergencyHours
  };
}

function chooseInverter(powerW, surgeW, manualId) {
  const manual = EMERGENCY_INVERTER_BANK.find((item) => item.id === manualId);
  if (manual) return { inverter: manual, count: 1, manual: true };
  const direct = EMERGENCY_INVERTER_BANK.find((item) => item.ratedPowerW >= powerW && item.surgePowerW >= surgeW);
  if (direct) return { inverter: direct, count: 1, manual: false };
  const largest = EMERGENCY_INVERTER_BANK.at(-1);
  return { inverter: largest, count: ceil(Math.max(powerW / largest.ratedPowerW, surgeW / largest.surgePowerW)), manual: false };
}

function chooseBattery(bankVoltage, requiredUsableWh, manualBatteryId) {
  const manual = SHIL_LITHIUM_BATTERIES.find((item) => item.id === manualBatteryId);
  const candidates = SHIL_LITHIUM_BATTERIES.filter((item) => bankVoltage % item.nominalVoltage === 0).sort((a, b) => b.energyWh - a.energyWh || b.capacityAh - a.capacityAh);
  const battery = manual || candidates[0] || SHIL_LITHIUM_BATTERIES.at(-1);
  const seriesCount = Math.max(1, Math.round(bankVoltage / battery.nominalVoltage));
  const usableStringWh = battery.nominalVoltage * battery.capacityAh * battery.usableDod * battery.efficiency * seriesCount;
  const parallelCount = ceil(requiredUsableWh / usableStringWh);
  return {
    battery,
    seriesCount,
    parallelCount,
    totalCount: seriesCount * parallelCount,
    bankVoltageV: battery.nominalVoltage * seriesCount,
    grossEnergyWh: battery.nominalVoltage * battery.capacityAh * seriesCount * parallelCount,
    usableEnergyWh: round(usableStringWh * parallelCount, 0),
    stringUsableWh: round(usableStringWh, 0),
    manual: Boolean(manual)
  };
}

function cableByCurrent(currentA) {
  if (currentA > 220) return "95mmÂ² ÛŒØ§ Ø¨Ø§Ø³â€ŒØ¨Ø§Ø± Ø·Ø±Ø§Ø­ÛŒâ€ŒØ´Ø¯Ù‡";
  if (currentA > 160) return "70mmÂ²";
  if (currentA > 120) return "50mmÂ²";
  if (currentA > 80) return "35mmÂ²";
  if (currentA > 50) return "25mmÂ²";
  if (currentA > 32) return "16mmÂ²";
  if (currentA > 20) return "10mmÂ²";
  return "6mmÂ²";
}

function protection(powerW, bankVoltage, batteryParallelCount) {
  const dcCurrentA = powerW / Math.max(12, bankVoltage) / 0.9;
  const acCurrentA = powerW / 220 / 0.9;
  const batteryBranchCurrentA = dcCurrentA / Math.max(1, batteryParallelCount);
  return {
    dcCurrentA: round(dcCurrentA, 1),
    acCurrentA: round(acCurrentA, 1),
    batteryBranchCurrentA: round(batteryBranchCurrentA, 1),
    batteryCable: cableByCurrent(batteryBranchCurrentA),
    acCable: cableByCurrent(acCurrentA),
    dcBreakerA: Math.ceil(dcCurrentA * 1.25 / 10) * 10,
    acBreakerA: Math.ceil(acCurrentA * 1.25 / 10) * 10,
    items: {
      inverter: ["Ú©Ù„ÛŒØ¯ ÙˆØ±ÙˆØ¯ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "Ú©Ù„ÛŒØ¯ Ø®Ø±ÙˆØ¬ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "Ø­ÙØ§Ø¸Øª Ø§Ø¶Ø§ÙÙ‡â€ŒØ¨Ø§Ø±", "Ø­ÙØ§Ø¸Øª Ø§ØªØµØ§Ù„ Ú©ÙˆØªØ§Ù‡"],
      battery: SHIL_SOLAR_PROTECTION_BANK.battery,
      earthing: ["Ø§Ø±ØªÛŒÙ†Ú¯ Ùˆ Ù‡Ù…Ø¨Ù†Ø¯ÛŒ", "Ø³Ø±Ø¬ Ø§Ø±Ø³ØªØ± AC", "Ø¨Ø±Ú†Ø³Ø¨â€ŒÚ¯Ø°Ø§Ø±ÛŒ Ù…Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ù…Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ Ø§Ø² Ù…Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ø¹Ø§Ø¯ÛŒ"]
    }
  };
}

function buildValidation({ load, designPowerW, designSurgeW, inverter, inverterCount, battery, requiredEnergyWh }) {
  const checks = [];
  const push = (key, ok, level, message, fix = "") => checks.push({ key, ok, level: ok ? "ok" : level, message, fix });
  push("load", load.totalPowerW > 0, "error", "ØªÙˆØ§Ù† Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª.", "Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ Ø±Ø§ Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø«Ø¨Øª Ú©Ù†ÛŒØ¯.");
  push("hours", load.requiredEmergencyHours > 0, "error", "Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.", "Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.");
  push("inverter-power", inverter.ratedPowerW * inverterCount >= designPowerW, "error", "ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ú©Ø§ÙÛŒ Ø§Ø³Øª.", "Ù…Ø¯Ù„ Ø¨Ø²Ø±Ú¯â€ŒØªØ± ÛŒØ§ ØªØ¹Ø¯Ø§Ø¯ Ø¨ÛŒØ´ØªØ± Ø§Ù†ØªØ®Ø§Ø¨ Ø´ÙˆØ¯.");
  push("inverter-surge", inverter.surgePowerW * inverterCount >= designSurgeW, "warning", "ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø¨Ø±Ø§ÛŒ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ Ú©Ø§ÙÛŒ Ø§Ø³Øª.", "Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ù…ÙˆØªÙˆØ±ÛŒ ÛŒØ§ Ø¶Ø±ÛŒØ¨ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ Ø´ÙˆØ¯.");
  push("parallel", inverterCount === 1 || inverter.parallelCapable, "error", "Ø§ÙØ²Ø§ÛŒØ´ ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø§ Ù‚Ø§Ø¨Ù„ÛŒØª Ù…ÙˆØ§Ø²ÛŒâ€ŒØ³Ø§Ø²ÛŒ Ø³Ø§Ø²Ú¯Ø§Ø± Ø§Ø³Øª.", "Ø§Ø² Ù…Ø¯Ù„ Ø¯Ø§Ø±Ø§ÛŒ Ù‚Ø§Ø¨Ù„ÛŒØª Ù…ÙˆØ§Ø²ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø´ÙˆØ¯.");
  push("battery", battery.usableEnergyWh >= requiredEnergyWh, "error", "Ø¸Ø±ÙÛŒØª Ù‚Ø§Ø¨Ù„ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø¨Ø§ØªØ±ÛŒ Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø±Ø§ Ù¾ÙˆØ´Ø´ Ù…ÛŒâ€ŒØ¯Ù‡Ø¯.", "ØªØ¹Ø¯Ø§Ø¯ Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø§ØªØ±ÛŒ Ø§ÙØ²Ø§ÛŒØ´ ÛŒØ§Ø¨Ø¯.");
  const errors = checks.filter((c) => c.level === "error" && !c.ok).map((c) => c.fix || c.message);
  const warnings = checks.filter((c) => c.level === "warning" && !c.ok).map((c) => c.fix || c.message);
  return { checks, errors, warnings };
}

export function runEmergencyPowerDesign({ load = {}, settings = {} } = {}) {
  const normalized = normalizeLoad({ ...load, requiredEmergencyHours: settings.requiredEmergencyHours ?? load.requiredEmergencyHours ?? load.emergencyHours ?? load.backupHours });
  const reserveFactor = clamp(settings.reserveFactor, 1, 1.8) || 1.25;
  const designPowerW = Math.ceil(normalized.totalPowerW * reserveFactor);
  const designSurgeW = Math.ceil(normalized.surgePowerW * 1.05);
  const inverterPick = chooseInverter(designPowerW, designSurgeW, settings.inverterId);
  const baseInverterCount = Math.max(inverterPick.count, num(settings.inverterCount, inverterPick.count));
  const inverterCount = Math.max(inverterPick.count, ceil(baseInverterCount * Math.max(1, num(settings.inverterExtraFactor, 1))));
  const requiredEnergyWh = Math.ceil(designPowerW * normalized.requiredEmergencyHours / inverterPick.inverter.efficiency);
  const batteryDesign = chooseBattery(inverterPick.inverter.batteryVoltage, requiredEnergyWh, settings.batteryId);
  const baseBatteryCount = Math.max(batteryDesign.totalCount, num(settings.batteryCount, batteryDesign.totalCount));
  const batteryTotalCount = Math.max(batteryDesign.totalCount, ceil(baseBatteryCount * Math.max(1, num(settings.batteryExtraFactor, 1))));
  const batteryFinal = { ...batteryDesign, totalCount: batteryTotalCount, parallelCount: Math.max(batteryDesign.parallelCount, Math.ceil(batteryTotalCount / Math.max(1, batteryDesign.seriesCount))) };
  batteryFinal.usableEnergyWh = round(batteryDesign.stringUsableWh * batteryFinal.parallelCount, 0);
  batteryFinal.grossEnergyWh = batteryFinal.bankVoltageV * batteryFinal.battery.capacityAh * batteryFinal.parallelCount;
  const protections = protection(designPowerW, inverterPick.inverter.batteryVoltage, batteryFinal.parallelCount);
  const validation = buildValidation({ load: normalized, designPowerW, designSurgeW, inverter: inverterPick.inverter, inverterCount, battery: batteryFinal, requiredEnergyWh });
  const confidence = clamp(100 - validation.errors.length * 26 - validation.warnings.length * 9, 35, 100);

  return {
    valid: validation.errors.length === 0,
    method: "emergency-power-engineering-logic-100",
    label: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    confidence,
    load: normalized,
    design: { designPowerW, designSurgeW, requiredEnergyWh },
    settings: {
      reserveFactor,
      requiredEmergencyHours: normalized.requiredEmergencyHours,
      inverterExtraFactor: num(settings.inverterExtraFactor, 1),
      batteryExtraFactor: num(settings.batteryExtraFactor, 1)
    },
    inverter: { ...inverterPick.inverter, count: inverterCount, manual: inverterPick.manual },
    battery: batteryFinal,
    requiredEnergyWh,
    protection: protections,
    validation,
    warnings: validation.warnings,
    errors: validation.errors,
    banks: { inverters: EMERGENCY_INVERTER_BANK, batteries: SHIL_LITHIUM_BATTERIES },
    equipmentSchedule: [
      { group: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", qty: inverterCount, spec: `${inverterPick.inverter.ratedPowerW}W / ${inverterPick.inverter.batteryVoltage}V`, reason: "Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ùˆ ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ" },
      { group: "Ø¨Ø§ØªØ±ÛŒ", qty: batteryFinal.totalCount, spec: `${batteryFinal.battery.nominalVoltage}V ${batteryFinal.battery.capacityAh}Ah`, reason: "ØªØ£Ù…ÛŒÙ† Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²" },
      { group: "Ø­ÙØ§Ø¸Øª DC", qty: 1, spec: `${protections.dcBreakerA}A / ${protections.batteryCable}`, reason: "Ø­ÙØ§Ø¸Øª Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ Ùˆ Ù…Ø³ÛŒØ± DC" },
      { group: "Ø­ÙØ§Ø¸Øª AC", qty: 1, spec: `${protections.acBreakerA}A / ${protections.acCable}`, reason: "Ø­ÙØ§Ø¸Øª Ø®Ø±ÙˆØ¬ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ùˆ Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ù…Ø¯Ø§Ø±Ù‡Ø§" }
    ],
    explanations: [
      `ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¨Ø§ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† ${reserveFactor} Ø¨Ø±Ø§Ø¨Ø±ØŒ ${designPowerW} ÙˆØ§Øª Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯.`,
      `Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² ${normalized.requiredEmergencyHours} Ø³Ø§Ø¹Øª Ø¯Ø± Ø¸Ø±ÙÛŒØª Ø¨Ø§ØªØ±ÛŒ Ù„Ø­Ø§Ø¸ Ø´Ø¯.`,
      `Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¨Ø§ÛŒØ¯ Ù‡Ù… ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ùˆ Ù‡Ù… ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ Ø±Ø§ Ù¾ÙˆØ´Ø´ Ø¯Ù‡Ø¯.`,
      `Ø¢Ø±Ø§ÛŒØ´ Ø¨Ø§ØªØ±ÛŒ ${batteryFinal.seriesCount} Ø³Ø±ÛŒ Ã— ${batteryFinal.parallelCount} Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø±Ø§ÛŒ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ù†Ú© Ùˆ Ø¸Ø±ÙÛŒØª Ø§Ù†Ø±Ú˜ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯.`,
      `ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø­ÙØ§Ø¸ØªÛŒ Ø´Ø§Ù…Ù„ Ø­ÙØ§Ø¸Øª Ø¨Ø§ØªØ±ÛŒØŒ Ø®Ø±ÙˆØ¬ÛŒ ACØŒ Ø§Ø±ØªÛŒÙ†Ú¯ØŒ Ø³Ø±Ø¬ Ø§Ø±Ø³ØªØ± Ùˆ Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ù…Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¯Ø± Ø®Ø±ÙˆØ¬ÛŒ Ø§Ø¬Ø±Ø§ Ù‚Ø±Ø§Ø± Ú¯Ø±ÙØª.`
    ],
    nextBlockedReason: validation.errors[0] || ""
  };
}

export { EMERGENCY_INVERTER_BANK };
