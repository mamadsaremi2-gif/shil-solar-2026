import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const ceil = (value) => Math.max(1, Math.ceil(Number(value) || 0));
const round = (value, digits = 2) => Number((Number(value) || 0).toFixed(digits));
const pickById = (items, id) => items.find((item) => item.id === id);

function normalizeLoad(load = {}) {
  const selected = Array.isArray(load.selectedEquipment) ? load.selectedEquipment : [];
  const simplePower = selected.reduce((sum, item) => sum + (Number(item.powerW || item.watt || 0) * Number(item.quantity || 1)), 0);
  const motorSurge = selected.reduce((sum, item) => {
    const power = Number(item.powerW || item.watt || 0) * Number(item.quantity || 1);
    const isMotor = Boolean(item.isMotor || item.motor);
    const factor = isMotor ? (item.softStarter ? 1.2 : 2.5) : 1;
    return sum + power * factor;
  }, 0);
  const totalPowerW = Number(load.totalPowerW || load.designPowerW || load.powerW || simplePower || 3000);
  const surgePowerW = Number(load.surgePowerW || load.startupPowerW || motorSurge || totalPowerW * 1.25);
  const totalEnergyWh = Number(load.totalEnergyWh || (load.totalEnergyKWh ? load.totalEnergyKWh * 1000 : 0) || (load.dailyEnergy ? load.dailyEnergy * 1000 : 0) || 12000);
  return { totalPowerW, surgePowerW, totalEnergyWh };
}

function choosePanel(panelId, panelPowerW) {
  if (panelId) return pickById(SHIL_SOLAR_PANELS, panelId) || SHIL_SOLAR_PANELS.at(-1);
  const target = Number(panelPowerW || 620);
  return [...SHIL_SOLAR_PANELS].sort((a, b) => Math.abs(a.powerW - target) - Math.abs(b.powerW - target))[0] || SHIL_SOLAR_PANELS.at(-1);
}

function chooseInverter(requiredPowerW, requiredSurgeW, preferredVoltage, inverterId) {
  const manual = pickById(SHIL_SOLAR_INVERTERS, inverterId);
  if (manual) return { inverter: manual, parallelCount: 1, parallelRequired: false, manual: true };
  const candidates = SHIL_SOLAR_INVERTERS.filter((item) => !preferredVoltage || item.dcVoltage === Number(preferredVoltage));
  const pool = (candidates.length ? candidates : SHIL_SOLAR_INVERTERS).sort((a, b) => a.ratedPowerW - b.ratedPowerW);
  const direct = pool.find((item) => item.ratedPowerW >= requiredPowerW && item.surgePowerW >= requiredSurgeW);
  if (direct) return { inverter: direct, parallelCount: 1, parallelRequired: false, manual: false };
  const largest = pool.at(-1);
  return { inverter: largest, parallelCount: ceil(Math.max(requiredPowerW / largest.ratedPowerW, requiredSurgeW / largest.surgePowerW)), parallelRequired: true, manual: false };
}

function batteryAlternatives(systemVoltage) {
  if (systemVoltage === 12) return [{ label: "باتری 12 ولت مستقیم", baseVoltage: 12, series: 1, priority: 1 }];
  if (systemVoltage === 24) return [
    { label: "باتری 24 ولت مستقیم", baseVoltage: 24, series: 1, priority: 1 },
    { label: "ساخت 24 ولت با 2 عدد باتری 12 ولت سری", baseVoltage: 12, series: 2, priority: 2 }
  ];
  return [
    { label: "باتری 48 ولت مستقیم", baseVoltage: 48, series: 1, priority: 1 },
    { label: "ساخت 48 ولت با 2 عدد باتری 24 ولت سری", baseVoltage: 24, series: 2, priority: 2 },
    { label: "ساخت 48 ولت با 4 عدد باتری 12 ولت سری", baseVoltage: 12, series: 4, priority: 3 }
  ];
}

function chooseBattery(systemVoltage, requiredWh, preferredBatteryVoltage, batteryId) {
  const manualBattery = pickById(SHIL_LITHIUM_BATTERIES, batteryId);
  const alternatives = batteryAlternatives(systemVoltage);
  const preferred = preferredBatteryVoltage ? alternatives.find((a) => a.baseVoltage === Number(preferredBatteryVoltage)) : null;
  const alt = manualBattery ? (alternatives.find((a) => a.baseVoltage === manualBattery.nominalVoltage) || { label: `${manualBattery.nominalVoltage} ولت مستقیم`, baseVoltage: manualBattery.nominalVoltage, series: Math.max(1, Math.round(systemVoltage / manualBattery.nominalVoltage)), priority: 9 }) : (preferred || alternatives[0]);
  const bank = SHIL_LITHIUM_BATTERIES.filter((item) => item.nominalVoltage === alt.baseVoltage).sort((a, b) => b.capacityAh - a.capacityAh);
  const battery = manualBattery || bank[0] || SHIL_LITHIUM_BATTERIES[0];
  const usableStringWh = battery.nominalVoltage * battery.capacityAh * battery.usableDod * battery.efficiency * alt.series;
  const parallel = ceil(requiredWh / usableStringWh);
  return {
    battery,
    strategy: alt,
    seriesCount: alt.series,
    parallelCount: parallel,
    totalCount: alt.series * parallel,
    nominalBankVoltage: battery.nominalVoltage * alt.series,
    usableEnergyWh: round(usableStringWh * parallel, 0),
    voltageRange: `${battery.minVoltage * alt.series} تا ${battery.maxVoltage * alt.series} ولت`,
    manual: Boolean(manualBattery)
  };
}

function sizePvArray({ dailyWh, psh, panel, inverter, losses, autonomyDays, manualPanelCount }) {
  const requiredPvW = dailyWh / Math.max(1, psh) / Math.max(0.35, losses) * (autonomyDays > 1 ? 1.08 : 1);
  const panelCount = manualPanelCount ? Math.max(1, Number(manualPanelCount)) : ceil(requiredPvW / panel.powerW);
  const minSeries = ceil(inverter.mpptMinV / panel.vmp);
  const maxSeries = Math.max(minSeries, Math.floor((inverter.mpptMaxV * 0.92) / panel.voc));
  const targetSeries = clamp(Math.round((inverter.mpptMinV + inverter.mpptMaxV) / 2 / panel.vmp), minSeries, maxSeries);
  const parallel = ceil(panelCount / targetSeries);
  const totalPanels = targetSeries * parallel;
  return {
    requiredPvW: round(requiredPvW, 0),
    panelCount: totalPanels,
    seriesCount: targetSeries,
    parallelCount: parallel,
    arrayPowerW: totalPanels * panel.powerW,
    stringVmp: round(targetSeries * panel.vmp, 1),
    stringVoc: round(targetSeries * panel.voc, 1),
    stringCurrentA: round(panel.imp, 2),
    totalCurrentA: round(panel.imp * parallel, 2),
    areaM2: round(totalPanels * (panel.areaM2 || 2.6), 1),
    maintenanceAreaM2: round(totalPanels * (panel.areaM2 || 2.6) * 1.25, 1),
    manual: Boolean(manualPanelCount)
  };
}

function sizeCableAndProtection({ inverter, inverterParallel, pvArray, batteryDesign, designPowerW }) {
  const dcCurrentA = designPowerW / inverter.dcVoltage / 0.92;
  const batteryCurrentA = dcCurrentA / Math.max(1, batteryDesign.parallelCount);
  const acCurrentA = designPowerW / 220 / 0.9;
  const dcCable = dcCurrentA > 180 ? "70mm² یا طراحی موازی باس‌بار" : dcCurrentA > 120 ? "50mm²" : dcCurrentA > 75 ? "35mm²" : dcCurrentA > 45 ? "25mm²" : "16mm²";
  const acCable = acCurrentA > 80 ? "35mm²" : acCurrentA > 50 ? "25mm²" : acCurrentA > 32 ? "16mm²" : "10mm²";
  const batteryCable = batteryCurrentA > 150 ? "50mm²" : batteryCurrentA > 100 ? "35mm²" : batteryCurrentA > 60 ? "25mm²" : "16mm²";
  const pvCable = pvArray.totalCurrentA > 40 ? "10mm²" : "6mm²";
  const dcBreakerA = Math.ceil(dcCurrentA * 1.25 / 10) * 10;
  const acBreakerA = Math.ceil(acCurrentA * 1.25 / 10) * 10;
  const pvFuseA = Math.ceil(pvArray.stringCurrentA * 1.56 / 5) * 5;
  return {
    dcCable, acCable, pvCable, batteryCable, dcBreakerA, acBreakerA, pvFuseA, inverterParallel,
    protectionItems: SHIL_SOLAR_PROTECTION_BANK,
    report: [
      `جریان DC اینورتر حدود ${round(dcCurrentA, 1)} آمپر است؛ کابل ${dcCable} با ضریب اطمینان و افت ولتاژ کم پیشنهاد شد.`,
      `جریان AC خروجی حدود ${round(acCurrentA, 1)} آمپر است؛ بریکر ${acBreakerA} آمپر و کابل ${acCable} برای حفاظت اضافه‌بار انتخاب شد.`,
      `جریان هر رشته پنل ${pvArray.stringCurrentA} آمپر است؛ فیوز رشته ${pvFuseA} آمپر با ضریب 1.56 برای جریان اتصال کوتاه پنل پیشنهاد شد.`,
      `کابل باتری ${batteryCable} بر اساس جریان شاخه باتری و تقسیم جریان بین موازی‌ها انتخاب شد.`
    ]
  };
}

function validateManual({ designPowerW, designSurgeW, inverterPick, batteryDesign, pvArray, requiredBatteryWh, settings }) {
  const warnings = [];
  const baseInverterCount = Math.max(1, Number(settings.inverterCount || inverterPick.parallelCount || 1));
  const inverterCount = Math.max(baseInverterCount, ceil(baseInverterCount * Math.max(1, Number(settings.inverterExtraFactor || 1))));
  const batteryCount = Math.max(1, Number(settings.batteryCount || batteryDesign.totalCount || 1));
  const panelCount = Math.max(1, Number(settings.panelCount || pvArray.panelCount || 1));
  const inverterCapacity = inverterPick.inverter.ratedPowerW * inverterCount;
  const surgeCapacity = inverterPick.inverter.surgePowerW * inverterCount;
  const batteryUsableWh = batteryDesign.battery.nominalVoltage * batteryDesign.battery.capacityAh * batteryDesign.battery.usableDod * batteryDesign.battery.efficiency * batteryCount;
  const pvCapacityW = pvArray.panelCount * pvArray.arrayPowerW / Math.max(1, pvArray.panelCount);

  if (inverterCapacity < designPowerW) warnings.push(`توان اینورتر انتخابی (${inverterCapacity} وات) از توان طراحی (${designPowerW} وات) کمتر است؛ مدل بزرگ‌تر یا تعداد بیشتر انتخاب کنید.`);
  if (surgeCapacity < designSurgeW) warnings.push(`توان راه‌اندازی اینورتر (${surgeCapacity} وات) برای بارهای موتوری/لحظه‌ای (${designSurgeW} وات) کافی نیست.`);
  if (batteryUsableWh < requiredBatteryWh) warnings.push(`ظرفیت قابل استفاده باتری (${round(batteryUsableWh,0)}Wh) کمتر از نیاز انرژی (${round(requiredBatteryWh,0)}Wh) است.`);
  if (panelCount < pvArray.panelCount && settings.panelCount) warnings.push("تعداد پنل دستی از تعداد پیشنهادی SHIL کمتر است؛ شارژ باتری و تولید روزانه کافی نخواهد بود.");
  const inv = inverterPick.inverter;
  const batteryMin = batteryDesign.battery.minVoltage * batteryDesign.seriesCount;
  const batteryMax = batteryDesign.battery.maxVoltage * batteryDesign.seriesCount;
  if (batteryMax < inv.batteryMinVoltage || batteryMin > inv.batteryMaxVoltage) warnings.push(`ولتاژ شناور باتری (${batteryMin} تا ${batteryMax}V) با ورودی باتری اینورتر ${inv.dcVoltage}V سازگار نیست.`);
  return warnings;
}

export function runSolarAutoDesign({ load, environment, settings = {} }) {
  const normalized = normalizeLoad(load);
  const autonomyDays = Number(settings.autonomyDays || 1);
  const reserveFactor = Number(settings.reserveFactor || 1.2);
  const designPowerW = Math.ceil(normalized.totalPowerW * reserveFactor);
  const designSurgeW = Math.ceil(normalized.surgePowerW || designPowerW * 1.5);
  const psh = Number(environment?.peakSunHours || environment?.peakSunHour || environment?.sunHours || 5.2);
  const thermalLoss = Number(environment?.temperatureDerating || environment?.environmentAssessment?.thermalDeratingPercent || 8) / 100;
  const soilingLoss = Number(environment?.soilingLossPercent || environment?.environmentAssessment?.soilingLossPercent || 5) / 100;
  const losses = clamp(0.86 - thermalLoss - soilingLoss, 0.55, 0.86);

  const requestedSystemType = settings.systemType || "offgrid";
  const smartSystemVoltage = requestedSystemType === "ongrid" ? 48 : requestedSystemType === "hybrid" ? 48 : settings.systemVoltage;
  const inverterPick = chooseInverter(designPowerW, designSurgeW, smartSystemVoltage, settings.inverterId);
  const baseInverterCount = Math.max(1, Number(settings.inverterCount || inverterPick.parallelCount || 1));
  const inverterCount = Math.max(baseInverterCount, ceil(baseInverterCount * Math.max(1, Number(settings.inverterExtraFactor || 1))));
  const panel = choosePanel(settings.panelId, settings.panelPowerW || 620);
  const requiredBatteryWh = normalized.totalEnergyWh * autonomyDays;
  const batteryDesign = chooseBattery(inverterPick.inverter.dcVoltage, requiredBatteryWh, settings.batteryVoltage, settings.batteryId);
  const baseBatteryCount = Number(settings.batteryCount || batteryDesign.totalCount || 0);
  const batteryCount = Math.max(baseBatteryCount, ceil(baseBatteryCount * Math.max(1, Number(settings.batteryExtraFactor || 1))));
  const pvArray = sizePvArray({ dailyWh: normalized.totalEnergyWh, psh, panel, inverter: inverterPick.inverter, losses, autonomyDays, manualPanelCount: settings.panelCount });
  const basePanelCount = Number(settings.panelCount || pvArray.panelCount || 0);
  const panelCountWithFutureReserve = Math.max(basePanelCount, ceil(basePanelCount * Math.max(1, Number(settings.panelExtraFactor || 1))));
  const protection = sizeCableAndProtection({ inverter: inverterPick.inverter, inverterParallel: inverterCount, pvArray, batteryDesign, designPowerW });

  const warnings = [];
  if (!normalized.totalEnergyWh || normalized.totalEnergyWh <= 0) warnings.push("انرژی مصرفی معتبر نیست؛ ابتدا یکی از روش‌های محاسبات بار را تکمیل کنید.");
  if (!normalized.totalPowerW || normalized.totalPowerW <= 0) warnings.push("توان کل معتبر نیست؛ امکان انتخاب اینورتر وجود ندارد.");
  if (pvArray.arrayPowerW > inverterPick.inverter.maxPvPowerW * inverterCount) warnings.push("توان آرایه پنل از سقف ورودی PV اینورتر بیشتر است؛ تعداد اینورتر یا مدل اینورتر باید اصلاح شود.");
  if (inverterCount > 1 && !inverterPick.inverter.parallelCapable) warnings.push("تعداد اینورتر بیشتر از یک عدد است اما مدل انتخابی قابلیت پارالل ندارد.");
  warnings.push(...validateManual({ designPowerW, designSurgeW, inverterPick, batteryDesign, pvArray, requiredBatteryWh, settings: { ...settings, inverterCount, batteryCount } }));

  const batteryTotalCount = Math.max(batteryDesign.totalCount, batteryCount);
  const panelTotalCount = Math.max(pvArray.panelCount, panelCountWithFutureReserve);
  const explanations = [
    `توان طراحی با ضریب افزایش استاندارد ${reserveFactor} برابر، ${designPowerW} وات محاسبه شد.`,
    `توان راه‌اندازی ${designSurgeW} وات است؛ بارهای موتوری بدون سافت‌استارتر با ضریب 2.5 و با سافت‌استارتر با ضریب 1.2 لحاظ می‌شوند.`,
    `اینورتر ${inverterPick.inverter.title} انتخاب شد چون توان نامی و توان لحظه‌ای مورد نیاز را پوشش می‌دهد.`,
    `ولتاژ باتری به صورت شناور بررسی شد؛ برای 12V محدوده 11 تا 13، برای 24V محدوده 22 تا 26 و برای 48V محدوده 44 تا 52 ولت پذیرفته می‌شود.`,
    `آرایش پنل ${pvArray.seriesCount} سری × ${pvArray.parallelCount} موازی انتخاب شد تا ولتاژ رشته داخل محدوده MPPT اینورتر بماند.`,
    `فضای نصب پنل با احتساب مسیر تعمیر و نگهداری ${pvArray.maintenanceAreaM2} مترمربع برآورد شد.`,
    `ضرایب توسعه آینده در محاسبه نهایی لحاظ شدند: اینورتر ${Number(settings.inverterExtraFactor || 1)}، باتری ${Number(settings.batteryExtraFactor || 1)}، پنل ${Number(settings.panelExtraFactor || 1)}.`
  ];
  if (inverterCount > 1) explanations.push(`برای توسعه/توان بیشتر، ${inverterCount} عدد اینورتر در نظر گرفته شده است.`);

  return {
    valid: warnings.length === 0,
    method: "solar-auto-design",
    load: normalized,
    settings: {
      autonomyDays,
      reserveFactor,
      systemType: requestedSystemType,
      manual: settings.manualMode || false,
      equipmentManual: settings.equipmentManualMode || false,
      parameterManual: settings.parameterManualMode || false,
      panelExtraFactor: Number(settings.panelExtraFactor || 1),
      inverterExtraFactor: Number(settings.inverterExtraFactor || 1),
      batteryExtraFactor: Number(settings.batteryExtraFactor || 1)
    },
    inverter: { ...inverterPick.inverter, count: inverterCount, parallelRequired: inverterCount > 1, manual: inverterPick.manual },
    panel,
    pvArray: { ...pvArray, panelCount: panelTotalCount },
    battery: { ...batteryDesign, totalCount: batteryTotalCount },
    protection,
    space: {
      panelAreaM2: round(panelTotalCount * (panel.areaM2 || 2.6), 1),
      maintenanceAreaM2: round(panelTotalCount * (panel.areaM2 || 2.6) * 1.25, 1),
      note: "فضا شامل سطح پنل‌ها به‌علاوه حدود 25٪ مسیر دسترسی، فاصله سرویس و نگهداری است."
    },
    banks: { inverters: SHIL_SOLAR_INVERTERS, batteries: SHIL_LITHIUM_BATTERIES, panels: SHIL_SOLAR_PANELS },
    losses: { psh, effectiveEfficiency: round(losses, 3), thermalLossPercent: round(thermalLoss * 100, 1), soilingLossPercent: round(soilingLoss * 100, 1) },
    warnings,
    explanations,
    nextBlockedReason: warnings[0] || ""
  };
}
