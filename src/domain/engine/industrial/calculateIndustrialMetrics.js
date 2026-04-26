function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function stepUp(value, steps) {
  return steps.find((item) => item >= value) ?? Math.ceil(value / 1000) * 1000;
}

const INVERTER_STEPS_W = [600, 1000, 1500, 2000, 3000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 30000, 50000];
const BATTERY_VOLTAGE_RECOMMENDATIONS = [
  { maxPowerW: 1200, voltage: 12 },
  { maxPowerW: 3000, voltage: 24 },
  { maxPowerW: 12000, voltage: 48 },
  { maxPowerW: 30000, voltage: 96 },
  { maxPowerW: Infinity, voltage: 192 },
];

export function calculateIndustrialMetrics(input, loads, battery, pv, inverter, controller, cabling, protection, simulation) {
  const requiredBackupHours = input.systemType === 'gridtie'
    ? 0
    : input.systemType === 'backup'
      ? input.backupHours
      : input.systemType === 'offgrid'
        ? input.daysAutonomy * 24
        : input.backupHours;

  const realBackupHours = input.systemType === 'offgrid'
    ? battery.realBackupHours
    : battery.realBackupHoursAtPeak ?? battery.realBackupHours;

  const backupCoverageRatio = requiredBackupHours > 0 ? realBackupHours / requiredBackupHours : 1;
  const batteryMarginPercent = battery.requiredBatteryWh > 0
    ? ((battery.bankNominalWh - battery.requiredBatteryWh) / battery.requiredBatteryWh) * 100
    : 0;

  const pvCoverageRatio = pv && loads.totalDailyEnergyWh > 0
    ? pv.estimatedDailyProductionWh / loads.totalDailyEnergyWh
    : 0;
  const pvWorstMonthCoverageRatio = pv && loads.totalDailyEnergyWh > 0
    ? (pv.worstMonthDailyProductionWh || 0) / loads.totalDailyEnergyWh
    : 0;
  const pvShortageWh = pv ? Math.max(loads.totalDailyEnergyWh - pv.estimatedDailyProductionWh, 0) : 0;
  const pvWorstMonthShortageWh = pv ? Math.max(loads.totalDailyEnergyWh - (pv.worstMonthDailyProductionWh || 0), 0) : 0;
  const pvSurplusWh = pv ? Math.max(pv.estimatedDailyProductionWh - loads.totalDailyEnergyWh, 0) : 0;

  const recommendedDcVoltage = BATTERY_VOLTAGE_RECOMMENDATIONS.find((item) => loads.demandPowerW <= item.maxPowerW)?.voltage ?? 48;
  const dcCurrentAtDemandA = loads.demandPowerW / Math.max(input.systemVoltage * input.inverterEfficiency, 1);
  const dcCurrentAtSurgeA = loads.surgePowerW / Math.max(input.systemVoltage * input.inverterEfficiency, 1);
  const currentStress = dcCurrentAtSurgeA > 300 ? 'critical' : dcCurrentAtDemandA > 180 ? 'high' : 'normal';

  const inverterNextStepW = stepUp(Math.max(inverter.continuousPowerW, loads.demandPowerW * 1.25), INVERTER_STEPS_W);
  const inverterUtilizationPercent = (loads.demandPowerW / Math.max(inverter.continuousPowerW, 1)) * 100;
  const surgeUtilizationPercent = (loads.surgePowerW / Math.max(inverter.surgePowerW, 1)) * 100;

  const batteryRequiredForDesiredHoursAh = requiredBackupHours > 0
    ? (loads.demandPowerW * requiredBackupHours * (battery.thermalFactor || 1) * (battery.reserveFactor || 1.1)) /
      Math.max(input.systemVoltage * input.dod * input.inverterEfficiency * input.cableLossFactor * (battery.dischargeEfficiency || 1), 1)
    : 0;

  const serviceabilityScore = Math.max(0, Math.min(100,
    100
    - (backupCoverageRatio < 1 ? (1 - backupCoverageRatio) * 35 : 0)
    - (pv && pvCoverageRatio < 1 ? (1 - pvCoverageRatio) * 18 : 0)
    - (pv && pvWorstMonthCoverageRatio < 0.75 && input.systemType === 'offgrid' ? 8 : 0)
    - (currentStress === 'critical' ? 20 : currentStress === 'high' ? 10 : 0)
    - (inverterUtilizationPercent > 85 ? 10 : 0)
    - (cabling?.batteryVoltageDropPercent > input.batteryVoltageDropLimit ? 5 : 0)
  ));

  const actionItems = [];
  if (input.systemVoltage < recommendedDcVoltage && input.systemType !== 'gridtie') {
    actionItems.push(`برای بار ${round(loads.demandPowerW)} وات، ولتاژ DC پیشنهادی حداقل ${recommendedDcVoltage}V است.`);
  }
  if (backupCoverageRatio < 1) {
    actionItems.push(`ظرفیت باتری برای ${round(requiredBackupHours, 1)} ساعت/هدف کافی نیست؛ حداقل ${round(batteryRequiredForDesiredHoursAh)}Ah در ${input.systemVoltage}V نیاز است.`);
  }
  if (pv && pvCoverageRatio < 1) {
    actionItems.push(`توان پنل برای پوشش انرژی روزانه کم است؛ کمبود تقریبی ${round(pvShortageWh)}Wh/day است.`);
  }
  if (pv && pvWorstMonthCoverageRatio < 0.85 && input.systemType === 'offgrid') {
    actionItems.push(`در ماه ضعیف سال پوشش خورشیدی حدود ${round(pvWorstMonthCoverageRatio * 100, 0)}٪ است؛ برای طراحی مطمئن زمستانی پنل بیشتری لازم است.`);
  }
  if (inverterUtilizationPercent > 85) {
    actionItems.push(`اینورتر در ${round(inverterUtilizationPercent, 0)}٪ ظرفیت کار می‌کند؛ انتخاب پله ${round(inverterNextStepW)}W مطمئن‌تر است.`);
  }
  if (controller?.controllerCount > 1) {
    actionItems.push(`جریان MPPT به ${controller.controllerCount} کنترلر ${controller.perControllerA}A تقسیم شده تا انتخاب بازار واقعی بماند.`);
  }

  if (surgeUtilizationPercent > 85) {
    actionItems.push(`پیک راه‌اندازی به ${round(surgeUtilizationPercent, 0)}٪ ظرفیت Surge می‌رسد؛ راه‌اندازی مرحله‌ای موتورها یا اینورتر بزرگ‌تر بررسی شود.`);
  }
  if (cabling?.batteryCurrentA > 250) {
    actionItems.push(`جریان باتری حدود ${round(cabling.batteryCurrentA, 0)}A است؛ برای اجرا از باس‌بار، کابل موازی یا ولتاژ DC بالاتر استفاده شود.`);
  }
  if (protection?.batteryFuseA > 400) {
    actionItems.push(`فیوز باتری ${protection.batteryFuseA}A غیرمعمول است؛ مسیر DC باید شاخه‌بندی یا ولتاژ سیستم افزایش یابد.`);
  }

  const requiredExtraBatteryAh = Math.max(batteryRequiredForDesiredHoursAh - battery.bankNominalAh, 0);
  const suggestedExtraBatteryParallels = requiredExtraBatteryAh > 0 ? Math.ceil(requiredExtraBatteryAh / Math.max(input.batteryUnitAh, 1)) : 0;
  const suggestedExtraBatteryUnits = suggestedExtraBatteryParallels * Math.max(battery.seriesCount || 1, 1);
  const worstMonthExtraPanels = pv && pvWorstMonthShortageWh > 0
    ? Math.ceil(pvWorstMonthShortageWh / Math.max(input.panelWatt * input.sunHours * Math.max(pv.performanceRatio || 0.75, 0.1) * 0.7, 1))
    : 0;

  return {
    requiredBackupHours: round(requiredBackupHours, 1),
    realBackupHours: round(realBackupHours, 1),
    backupCoverageRatio: round(backupCoverageRatio, 2),
    batteryMarginPercent: round(batteryMarginPercent, 1),
    batteryRequiredForDesiredHoursAh: round(batteryRequiredForDesiredHoursAh),
    pvCoverageRatio: round(pvCoverageRatio, 2),
    pvWorstMonthCoverageRatio: round(pvWorstMonthCoverageRatio, 2),
    pvShortageWh: round(pvShortageWh),
    pvWorstMonthShortageWh: round(pvWorstMonthShortageWh),
    pvSurplusWh: round(pvSurplusWh),
    recommendedDcVoltage,
    dcCurrentAtDemandA: round(dcCurrentAtDemandA, 1),
    dcCurrentAtSurgeA: round(dcCurrentAtSurgeA, 1),
    currentStress,
    inverterNextStepW,
    inverterUtilizationPercent: round(inverterUtilizationPercent, 0),
    surgeUtilizationPercent: round(surgeUtilizationPercent, 0),
    serviceabilityScore: round(serviceabilityScore, 0),
    requiredExtraBatteryAh: round(requiredExtraBatteryAh),
    suggestedExtraBatteryUnits,
    worstMonthExtraPanels,
    actionItems,
  };
}
