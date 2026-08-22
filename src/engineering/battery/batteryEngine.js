import { number, positive } from "../solar/solarBankRules.js";

export function runBatteryEngine(form = {}, options = {}) {
  const project = form.project || {};
  const battery = form.battery || {};
  const warnings = [];
  const errors = [];

  const scenario = String(project.scenario || project.systemType || "").toLowerCase();
  if (scenario === "ongrid" || scenario === "on-grid" || scenario === "on_grid") {
    return {
      valid: true,
      canContinue: true,
      requiredEnergyWh: 0,
      requiredCapacityAh: 0,
      usableEnergyWh: 0,
      batteryCount: 0,
      autonomyCoverageDays: 0,
      warnings,
      errors,
      explanations: ["برای سناریوی آنگرید، سایزینگ باتری الزامی نیست."],
      note: "Battery sizing skipped for ongrid scenario.",
    };
  }

  const dailyEnergyWh = positive(project.dailyEnergyWh ?? project.dailyEnergyKWh * 1000, 0);
  const autonomyDays = Math.max(positive(project.autonomyDays, positive(project.autonomyHours, 0) / 24), 0);
  const reserveFactor = Math.max(1, number(options.reserveFactor ?? project.reserveFactor ?? 1.2, 1.2));
  const nominalVoltage = positive(battery.nominalVoltage ?? battery.voltageV ?? battery.dcVoltage, 0);
  const capacityAh = positive(battery.capacityAh, 0);
  const depthOfDischarge = Math.min(1, Math.max(0, number(battery.depthOfDischarge ?? battery.dod ?? battery.dodRatio ?? 0.8, 0.8)));
  const roundTripEfficiency = Math.min(1, Math.max(0, number(battery.roundTripEfficiency ?? battery.efficiency ?? 0.92, 0.92)));

  if (dailyEnergyWh <= 0) errors.push({ code: "BATTERY_DAILY_ENERGY_MISSING", message: "مصرف روزانه برای محاسبه باتری معتبر نیست." });
  if (autonomyDays <= 0) warnings.push({ code: "BATTERY_AUTONOMY_ZERO", message: "روزهای پشتیبانی صفر است؛ حداقل مقدار پروژه بررسی شود." });
  if (nominalVoltage <= 0) errors.push({ code: "BATTERY_VOLTAGE_MISSING", message: "ولتاژ نامی باتری معتبر نیست." });
  if (capacityAh <= 0) warnings.push({ code: "BATTERY_CAPACITY_MISSING", message: "ظرفیت Ah باتری وارد نشده یا معتبر نیست." });
  if (depthOfDischarge <= 0 || roundTripEfficiency <= 0) errors.push({ code: "BATTERY_FACTOR_INVALID", message: "DoD یا راندمان باتری معتبر نیست." });

  const denominator = nominalVoltage * depthOfDischarge * roundTripEfficiency;
  const requiredEnergyWh = dailyEnergyWh * Math.max(autonomyDays, 0) * reserveFactor;
  const requiredCapacityAh = denominator > 0 ? requiredEnergyWh / denominator : 0;
  const usableEnergyWh = nominalVoltage * capacityAh * depthOfDischarge * roundTripEfficiency;
  const batteryCount = usableEnergyWh > 0 && requiredEnergyWh > 0 ? Math.ceil(requiredEnergyWh / usableEnergyWh) : 0;
  const totalUsableEnergyWh = usableEnergyWh * batteryCount;

  return {
    valid: errors.length === 0,
    canContinue: errors.length === 0,
    requiredEnergyWh,
    requiredCapacityAh,
    usableEnergyWh,
    batteryCount,
    totalUsableEnergyWh,
    autonomyCoverageDays: dailyEnergyWh > 0 ? totalUsableEnergyWh / dailyEnergyWh : 0,
    factors: { reserveFactor, depthOfDischarge, roundTripEfficiency, nominalVoltage, capacityAh },
    warnings,
    errors,
    explanations: errors.length ? errors.map((e) => e.message) : ["محاسبه باتری با کنترل خطا و ضریب اطمینان انجام شد."],
  };
}
