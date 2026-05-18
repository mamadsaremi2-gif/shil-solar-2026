import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const ceil = (value) => Math.max(1, Math.ceil(Number(value) || 0));
const round = (value, digits = 2) => Number((Number(value) || 0).toFixed(digits));

const EMERGENCY_INVERTER_BANK = [
  { id: "em-inv-1k-24", title: "اینورتر برق اضطراری 1 کیلووات / 24 ولت", ratedPowerW: 1000, surgePowerW: 2000, batteryVoltage: 24, efficiency: 0.9, parallelCapable: false },
  { id: "em-inv-2k-24", title: "اینورتر برق اضطراری 2 کیلووات / 24 ولت", ratedPowerW: 2000, surgePowerW: 4000, batteryVoltage: 24, efficiency: 0.91, parallelCapable: false },
  { id: "em-inv-3k-48", title: "اینورتر برق اضطراری 3 کیلووات / 48 ولت", ratedPowerW: 3000, surgePowerW: 6000, batteryVoltage: 48, efficiency: 0.92, parallelCapable: true },
  { id: "em-inv-5k-48", title: "اینورتر برق اضطراری 5 کیلووات / 48 ولت", ratedPowerW: 5000, surgePowerW: 10000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "em-inv-8k-48", title: "اینورتر برق اضطراری 8 کیلووات / 48 ولت", ratedPowerW: 8000, surgePowerW: 16000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true },
  { id: "em-inv-10k-48", title: "اینورتر برق اضطراری 10 کیلووات / 48 ولت", ratedPowerW: 10000, surgePowerW: 20000, batteryVoltage: 48, efficiency: 0.93, parallelCapable: true }
];

function normalizeLoad(load = {}) {
  const selected = Array.isArray(load.selectedEquipment) ? load.selectedEquipment : [];
  const equipmentPower = selected.reduce((sum, item) => sum + Number(item.powerW || item.watt || 0) * Number(item.quantity || 1), 0);
  const surge = selected.reduce((sum, item) => {
    const power = Number(item.powerW || item.watt || 0) * Number(item.quantity || 1);
    const factor = item.isMotor || item.motor ? (item.softStarter ? 1.2 : 2.5) : 1.15;
    return sum + power * factor;
  }, 0);
  const totalPowerW = Number(load.totalPowerW || load.designPowerW || load.powerW || equipmentPower || 2500);
  const surgePowerW = Number(load.surgePowerW || load.startupPowerW || surge || totalPowerW * 1.5);
  const emergencyHours = Number(load.emergencyHours || load.backupHours || load.requiredEmergencyHours || 2);
  return { selected, totalPowerW, surgePowerW, emergencyHours };
}

function chooseInverter(powerW, surgeW, manualId) {
  const manual = EMERGENCY_INVERTER_BANK.find((item) => item.id === manualId);
  if (manual) return { inverter: manual, count: 1, manual: true };
  const direct = EMERGENCY_INVERTER_BANK.find((item) => item.ratedPowerW >= powerW && item.surgePowerW >= surgeW);
  if (direct) return { inverter: direct, count: 1, manual: false };
  const largest = EMERGENCY_INVERTER_BANK.at(-1);
  return { inverter: largest, count: ceil(Math.max(powerW / largest.ratedPowerW, surgeW / largest.surgePowerW)), manual: false };
}

function chooseBattery(bankVoltage, requiredWh, manualBatteryId) {
  const manual = SHIL_LITHIUM_BATTERIES.find((item) => item.id === manualBatteryId);
  const candidates = SHIL_LITHIUM_BATTERIES.filter((item) => bankVoltage % item.nominalVoltage === 0).sort((a, b) => b.energyWh - a.energyWh);
  const battery = manual || candidates[0] || SHIL_LITHIUM_BATTERIES.at(-1);
  const seriesCount = Math.max(1, Math.round(bankVoltage / battery.nominalVoltage));
  const usableStringWh = battery.nominalVoltage * seriesCount * battery.capacityAh * battery.usableDod * battery.efficiency;
  const parallelCount = ceil(requiredWh / usableStringWh);
  return {
    battery,
    seriesCount,
    parallelCount,
    totalCount: seriesCount * parallelCount,
    bankVoltageV: battery.nominalVoltage * seriesCount,
    usableEnergyWh: round(usableStringWh * parallelCount, 0),
    manual: Boolean(manual)
  };
}

function protection(powerW, bankVoltage) {
  const dcCurrentA = powerW / Math.max(12, bankVoltage) / 0.9;
  const acCurrentA = powerW / 220 / 0.9;
  const batteryCable = dcCurrentA > 150 ? "50mm²" : dcCurrentA > 100 ? "35mm²" : dcCurrentA > 60 ? "25mm²" : "16mm²";
  const acCable = acCurrentA > 80 ? "35mm²" : acCurrentA > 50 ? "25mm²" : acCurrentA > 32 ? "16mm²" : "10mm²";
  return {
    batteryCable,
    acCable,
    dcBreakerA: Math.ceil(dcCurrentA * 1.25 / 10) * 10,
    acBreakerA: Math.ceil(acCurrentA * 1.25 / 10) * 10,
    items: {
      inverter: ["کلید ورودی اینورتر", "کلید خروجی اینورتر", "حفاظت اضافه‌بار", "حفاظت اتصال کوتاه"],
      battery: SHIL_SOLAR_PROTECTION_BANK.battery,
      earthing: ["ارتینگ و همبندی", "سرج ارستر AC", "برچسب‌گذاری مدارهای اضطراری"]
    }
  };
}

export function runEmergencyPowerDesign({ load = {}, settings = {} } = {}) {
  const normalized = normalizeLoad(load);
  const reserveFactor = Number(settings.reserveFactor || 1.25);
  const designPowerW = Math.ceil(normalized.totalPowerW * reserveFactor);
  const designSurgeW = Math.ceil(normalized.surgePowerW * 1.05);
  const inverterPick = chooseInverter(designPowerW, designSurgeW, settings.inverterId);
  const inverterCount = Math.max(inverterPick.count, ceil(inverterPick.count * Number(settings.inverterExtraFactor || 1)));
  const requiredEnergyWh = Math.ceil(designPowerW * normalized.emergencyHours / inverterPick.inverter.efficiency);
  const batteryDesign = chooseBattery(inverterPick.inverter.batteryVoltage, requiredEnergyWh, settings.batteryId);
  const batteryTotalCount = Math.max(batteryDesign.totalCount, ceil(batteryDesign.totalCount * Number(settings.batteryExtraFactor || 1)));
  const protections = protection(designPowerW, inverterPick.inverter.batteryVoltage);
  const warnings = [];
  if (inverterCount > 1 && !inverterPick.inverter.parallelCapable) warnings.push("مدل اینورتر انتخابی قابلیت افزایش موازی ندارد؛ مدل بزرگ‌تر پیشنهاد می‌شود.");
  if (batteryDesign.usableEnergyWh < requiredEnergyWh) warnings.push("ظرفیت قابل استفاده باتری کمتر از انرژی مورد نیاز برق اضطراری است.");
  return {
    valid: warnings.length === 0,
    method: "emergency-power-design",
    label: "برق اضطراری",
    load: normalized,
    settings: {
      reserveFactor,
      requiredEmergencyHours: normalized.emergencyHours,
      inverterExtraFactor: Number(settings.inverterExtraFactor || 1),
      batteryExtraFactor: Number(settings.batteryExtraFactor || 1)
    },
    inverter: { ...inverterPick.inverter, count: inverterCount, manual: inverterPick.manual },
    battery: { ...batteryDesign, totalCount: batteryTotalCount },
    requiredEnergyWh,
    protection: protections,
    banks: { inverters: EMERGENCY_INVERTER_BANK, batteries: SHIL_LITHIUM_BATTERIES },
    warnings,
    explanations: [
      `توان طراحی برق اضطراری با ضریب اطمینان ${reserveFactor} برابر، ${designPowerW} وات محاسبه شد.`,
      `زمان برق اضطراری مورد نیاز ${normalized.emergencyHours} ساعت در ظرفیت باتری لحاظ شد.`,
      `اینورتر انتخابی باید توان دائم و توان لحظه‌ای بارهای ضروری را پوشش دهد.`,
      `آرایش باتری ${batteryDesign.seriesCount} سری × ${batteryDesign.parallelCount} موازی برای رسیدن به ولتاژ بانک و ظرفیت انرژی انتخاب شد.`,
      `سیستم‌های حفاظتی شامل حفاظت باتری، خروجی AC، ارتینگ و جداسازی مدارهای اضطراری در لیست اجرا قرار گرفت.`
    ]
  };
}

export { EMERGENCY_INVERTER_BANK };
