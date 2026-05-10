function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((n(value) + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(n(value, min), min), max);
}

export function calculateFinancials(input, loads, pv, battery, inverter, simulation) {
  const isBackup = input.systemType === "backup";
  const panelCount = n(pv?.panelCount, 0);
  const pvPowerKw = n(pv?.installedPvPowerW, 0) / 1000;
  const inverterKw = n(inverter?.continuousPowerW, 0) / 1000;
  const batteryKwh = (n(battery?.bankVoltage, input.systemVoltage || 48) * n(battery?.totalAh, battery?.requiredBatteryAh || 0)) / 1000;
  const panelCostPerW = n(input.panelCostPerW, 0);
  const inverterCostPerKw = n(input.inverterCostPerKw, 0);
  const batteryCostPerKwh = n(input.batteryCostPerKwh, 0);
  const balanceOfSystemFactor = clamp(input.balanceOfSystemFactor ?? 0.22, 0.05, 0.75);
  const installationFactor = clamp(input.installationCostFactor ?? 0.12, 0.03, 0.5);
  const electricityTariff = n(input.electricityTariff, 0);
  const equipmentCost =
    (panelCostPerW ? panelCostPerW * n(pv?.installedPvPowerW, 0) : 0) +
    (inverterCostPerKw ? inverterCostPerKw * inverterKw : 0) +
    (batteryCostPerKwh ? batteryCostPerKwh * batteryKwh : 0);
  const bosCost = equipmentCost ? equipmentCost * balanceOfSystemFactor : 0;
  const installationCost = equipmentCost ? equipmentCost * installationFactor : 0;
  const totalEstimatedCost = equipmentCost + bosCost + installationCost;
  const annualProductionKwh = isBackup ? 0 : n(simulation?.annualEnergyWh, n(pv?.netDailyProductionWh, pv?.estimatedDailyProductionWh || 0) * 365) / 1000;
  const annualOffsetKwh = isBackup ? 0 : Math.min(annualProductionKwh, n(loads?.totalDailyEnergyWh, 0) * 365 / 1000);
  const annualSavings = electricityTariff ? annualOffsetKwh * electricityTariff : 0;
  const simplePaybackYears = annualSavings > 0 && totalEstimatedCost > 0 ? totalEstimatedCost / annualSavings : null;
  return {
    mode: isBackup ? "backup_resilience" : "solar_offset",
    pvPowerKw: round(pvPowerKw, 2),
    panelCount,
    inverterKw: round(inverterKw, 2),
    batteryKwh: round(batteryKwh, 2),
    equipmentCost: round(equipmentCost, 0),
    bosCost: round(bosCost, 0),
    installationCost: round(installationCost, 0),
    totalEstimatedCost: round(totalEstimatedCost, 0),
    annualProductionKwh: round(annualProductionKwh, 1),
    annualOffsetKwh: round(annualOffsetKwh, 1),
    annualSavings: round(annualSavings, 0),
    simplePaybackYears: simplePaybackYears ? round(simplePaybackYears, 1) : null,
    costCompleteness: equipmentCost > 0 ? "estimated" : "not_priced",
    notes: equipmentCost > 0
      ? ["هزینه‌ها تخمینی هستند و برای تصمیم مهندسی/برآورد اولیه استفاده می‌شوند."]
      : ["قیمت تجهیزات وارد نشده است؛ گزارش مالی فقط ظرفیت‌ها را نمایش می‌دهد."],
  };
}
