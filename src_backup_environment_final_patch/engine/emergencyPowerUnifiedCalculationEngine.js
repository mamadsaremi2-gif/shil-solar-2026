/**
 * Emergency power unified adapter.
 * Kept intentionally separate from the PV engine, but not empty anymore.
 * It provides a stable API for emergency-power pages while the dedicated
 * emergency engine is expanded in later updates.
 */

export const EMERGENCY_ENGINE_VERSION = "2026.05.24-emergency-adapter-1";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(toNumber(value, 0) * factor) / factor;
}

export function runUnifiedEmergencyPowerCalculation(input = {}) {
  const loadPowerW = toNumber(input.loadPowerW ?? input.totalPowerW, 0);
  const dailyEnergyWh = toNumber(input.dailyEnergyWh, 0);
  const backupHours = Math.max(0, toNumber(input.backupHours, 2));
  const surgeFactor = Math.max(1, toNumber(input.surgeFactor, 1.3));
  const dcVoltage = Math.max(12, toNumber(input.dcVoltage, 48));
  const inverterEfficiency = Math.min(1, Math.max(0.5, toNumber(input.inverterEfficiency, 0.92)));
  const batteryDod = Math.min(1, Math.max(0.1, toNumber(input.batteryDod, 0.8)));

  const requiredInverterW = loadPowerW * surgeFactor;
  const requiredEnergyWh = Math.max(dailyEnergyWh, loadPowerW * backupHours);
  const requiredBatteryWh = requiredEnergyWh / Math.max(0.1, batteryDod * inverterEfficiency);
  const batteryAh = requiredBatteryWh / dcVoltage;

  const warnings = [];
  if (!loadPowerW) warnings.push({ code: "LOAD_POWER_REQUIRED", level: "error", fa: "توان بار برای محاسبه برق اضطراری وارد نشده است." });
  if (surgeFactor < 1.2) warnings.push({ code: "LOW_SURGE_FACTOR", level: "warning", fa: "ضریب راه‌اندازی پایین است؛ بارهای موتوری بررسی شوند." });

  return {
    engine: "Unified SHIL Emergency Power Engine Adapter",
    version: EMERGENCY_ENGINE_VERSION,
    ok: !warnings.some((item) => item.level === "error"),
    canContinue: !warnings.some((item) => item.level === "error"),
    outputs: {
      requiredInverterW: round(requiredInverterW),
      requiredEnergyWh: round(requiredEnergyWh),
      requiredBatteryWh: round(requiredBatteryWh),
      batteryAh: round(batteryAh),
      dcVoltage,
    },
    warnings,
  };
}

export default runUnifiedEmergencyPowerCalculation;
