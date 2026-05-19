import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 2) => Number((num(value, 0)).toFixed(digits));
const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));

const EMERGENCY_INVERTER_BANK = [
  { id: "emergency-inv-1k-24", title: "اینورتر برق اضطراری 1 کیلووات / 24 ولت", ratedPowerW: 1000, surgePowerW: 2000, batteryVoltage: 24, efficiency: 0.9, parallelCapable: false },
  { id: "emergency-inv-2k-24", title: "اینورتر برق اضطراری 2 کیلووات / 24 ولت", ratedPowerW: 2000, surgePowerW: 4000, batteryVoltage: 24, efficiency: 0.91, parallelCapable: false },
  { id: "emergency-inv-3k-48", title: "اینورتر برق اضطراری 3 کیلووات / 48 ولت", ratedPowerW: 3000, surgePowerW: 6000, batteryVoltage: 48, efficiency: 0.92, parallelCapable: true },
  { id: "emergency-inv-5k-48", title: "اینورتر برق اضطراری 5 کیلووات / 48 ولت", ratedPowerW: 5000, surgePowerW: 10000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "emergency-inv-8k-48", title: "اینورتر برق اضطراری 8 کیلووات / 48 ولت", ratedPowerW: 8000, surgePowerW: 16000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "emergency-inv-10k-48", title: "اینورتر برق اضطراری 10 کیلووات / 48 ولت", ratedPowerW: 10000, surgePowerW: 20000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true }
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
  if (currentA > 220) return "95mm² یا باس‌بار طراحی‌شده";
  if (currentA > 160) return "70mm²";
  if (currentA > 120) return "50mm²";
  if (currentA > 80) return "35mm²";
  if (currentA > 50) return "25mm²";
  if (currentA > 32) return "16mm²";
  if (currentA > 20) return "10mm²";
  return "6mm²";
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
      inverter: ["کلید ورودی اینورتر برق اضطراری", "کلید خروجی برق اضطراری", "حفاظت اضافه‌بار", "حفاظت اتصال کوتاه"],
      battery: SHIL_SOLAR_PROTECTION_BANK.battery,
      earthing: ["ارتینگ و همبندی", "سرج ارستر AC", "برچسب‌گذاری مدارهای برق اضطراری", "جداسازی مدارهای ضروری از مدارهای عادی"]
    }
  };
}

function buildValidation({ load, designPowerW, designSurgeW, inverter, inverterCount, battery, requiredEnergyWh }) {
  const checks = [];
  const push = (key, ok, level, message, fix = "") => checks.push({ key, ok, level: ok ? "ok" : level, message, fix });
  push("load", load.totalPowerW > 0, "error", "توان بارهای ضروری معتبر است.", "بارهای ضروری را دوباره ثبت کنید.");
  push("hours", load.requiredEmergencyHours > 0, "error", "زمان برق اضطراری مورد نیاز ثبت شده است.", "زمان برق اضطراری مورد نیاز را وارد کنید.");
  push("inverter-power", inverter.ratedPowerW * inverterCount >= designPowerW, "error", "توان دائم اینورتر برق اضطراری کافی است.", "مدل بزرگ‌تر یا تعداد بیشتر انتخاب شود.");
  push("inverter-surge", inverter.surgePowerW * inverterCount >= designSurgeW, "warning", "توان لحظه‌ای برای راه‌اندازی بارهای ضروری کافی است.", "بارهای موتوری یا ضریب راه‌اندازی بازبینی شود.");
  push("parallel", inverterCount === 1 || inverter.parallelCapable, "error", "افزایش تعداد اینورتر با قابلیت موازی‌سازی سازگار است.", "از مدل دارای قابلیت موازی استفاده شود.");
  push("battery", battery.usableEnergyWh >= requiredEnergyWh, "error", "ظرفیت قابل استفاده باتری زمان برق اضطراری مورد نیاز را پوشش می‌دهد.", "تعداد موازی باتری افزایش یابد.");
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
    label: "برق اضطراری",
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
      { group: "اینورتر برق اضطراری", qty: inverterCount, spec: `${inverterPick.inverter.ratedPowerW}W / ${inverterPick.inverter.batteryVoltage}V`, reason: "پوشش توان دائم و توان لحظه‌ای بارهای ضروری" },
      { group: "باتری", qty: batteryFinal.totalCount, spec: `${batteryFinal.battery.nominalVoltage}V ${batteryFinal.battery.capacityAh}Ah`, reason: "تأمین زمان برق اضطراری مورد نیاز" },
      { group: "حفاظت DC", qty: 1, spec: `${protections.dcBreakerA}A / ${protections.batteryCable}`, reason: "حفاظت بانک باتری و مسیر DC" },
      { group: "حفاظت AC", qty: 1, spec: `${protections.acBreakerA}A / ${protections.acCable}`, reason: "حفاظت خروجی برق اضطراری و جداسازی مدارها" }
    ],
    explanations: [
      `توان طراحی برق اضطراری با ضریب اطمینان ${reserveFactor} برابر، ${designPowerW} وات محاسبه شد.`,
      `زمان برق اضطراری مورد نیاز ${normalized.requiredEmergencyHours} ساعت در ظرفیت باتری لحاظ شد.`,
      `اینورتر برق اضطراری باید هم توان دائم و هم توان لحظه‌ای بارهای ضروری را پوشش دهد.`,
      `آرایش باتری ${batteryFinal.seriesCount} سری × ${batteryFinal.parallelCount} موازی برای رسیدن به ولتاژ بانک و ظرفیت انرژی انتخاب شد.`,
      `تجهیزات حفاظتی شامل حفاظت باتری، خروجی AC، ارتینگ، سرج ارستر و جداسازی مدارهای برق اضطراری در خروجی اجرا قرار گرفت.`
    ],
    nextBlockedReason: validation.errors[0] || ""
  };
}

export { EMERGENCY_INVERTER_BANK };
