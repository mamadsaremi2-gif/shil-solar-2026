import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS, SHIL_SOLAR_PROTECTION_BANK } from "../../data/shilSolarBanks.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ceil = (value) => Math.max(1, Math.ceil(Number(value) || 0));
const round = (value, digits = 2) => Number((Number(value) || 0).toFixed(digits));

function normalizeLoad(load = {}) {
  const totalPowerW = Number(load.totalPowerW || load.designPowerW || load.powerW || 3000);
  const surgePowerW = Number(load.surgePowerW || load.startupPowerW || totalPowerW * 1.25);
  const totalEnergyWh = Number(load.totalEnergyWh || (load.totalEnergyKWh ? load.totalEnergyKWh * 1000 : 12000));
  return { totalPowerW, surgePowerW, totalEnergyWh };
}

function choosePanel(panelPowerW) {
  const target = Number(panelPowerW || 700);
  return [...SHIL_SOLAR_PANELS].sort((a, b) => Math.abs(a.powerW - target) - Math.abs(b.powerW - target))[0] || SHIL_SOLAR_PANELS.at(-1);
}

function chooseInverter(requiredPowerW, requiredSurgeW, preferredVoltage) {
  const candidates = SHIL_SOLAR_INVERTERS.filter((item) => !preferredVoltage || item.dcVoltage === Number(preferredVoltage));
  const pool = candidates.length ? candidates : SHIL_SOLAR_INVERTERS;
  const direct = pool.find((item) => item.ratedPowerW >= requiredPowerW && item.surgePowerW >= requiredSurgeW);
  if (direct) return { inverter: direct, parallelCount: 1, parallelRequired: false };

  const largest = pool[pool.length - 1];
  return {
    inverter: largest,
    parallelCount: ceil(Math.max(requiredPowerW / largest.ratedPowerW, requiredSurgeW / largest.surgePowerW)),
    parallelRequired: true
  };
}

function batteryAlternatives(systemVoltage) {
  if (systemVoltage === 12) return [
    { label: "باتری 12 ولت مستقیم", baseVoltage: 12, series: 1, priority: 1 }
  ];
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

function chooseBattery(systemVoltage, requiredWh, preferredBatteryVoltage) {
  const alternatives = batteryAlternatives(systemVoltage);
  const preferred = preferredBatteryVoltage ? alternatives.find((a) => a.baseVoltage === Number(preferredBatteryVoltage)) : null;
  const alt = preferred || alternatives[0];
  const bank = SHIL_LITHIUM_BATTERIES
    .filter((item) => item.nominalVoltage === alt.baseVoltage)
    .sort((a, b) => a.capacityAh - b.capacityAh);
  const battery = bank.find((item) => item.capacityAh === 100) || bank[0] || SHIL_LITHIUM_BATTERIES[0];
  const usableStringWh = battery.nominalVoltage * battery.capacityAh * battery.usableDod * battery.efficiency * alt.series;
  const parallel = ceil(requiredWh / usableStringWh);
  return {
    battery,
    strategy: alt,
    seriesCount: alt.series,
    parallelCount: parallel,
    totalCount: alt.series * parallel,
    nominalBankVoltage: systemVoltage,
    usableEnergyWh: round(usableStringWh * parallel, 0),
    voltageRange: `${battery.minVoltage * alt.series} تا ${battery.maxVoltage * alt.series} ولت`
  };
}

function sizePvArray({ dailyWh, psh, panel, inverter, losses, autonomyDays }) {
  const requiredPvW = dailyWh / Math.max(1, psh) / Math.max(0.35, losses) * (autonomyDays > 1 ? 1.08 : 1);
  const panelCount = ceil(requiredPvW / panel.powerW);
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
    totalCurrentA: round(panel.imp * parallel, 2)
  };
}

function sizeCableAndProtection({ inverter, inverterParallel, pvArray, batteryDesign, designPowerW }) {
  const dcCurrentA = designPowerW / inverter.dcVoltage / 0.92;
  const batteryCurrentA = dcCurrentA / Math.max(1, batteryDesign.parallelCount);
  const acCurrentA = designPowerW / 220 / 0.9;
  return {
    dcCable: dcCurrentA > 180 ? "70mm² یا طراحی موازی باس‌بار" : dcCurrentA > 120 ? "50mm²" : dcCurrentA > 75 ? "35mm²" : dcCurrentA > 45 ? "25mm²" : "16mm²",
    acCable: acCurrentA > 80 ? "35mm²" : acCurrentA > 50 ? "25mm²" : acCurrentA > 32 ? "16mm²" : "10mm²",
    pvCable: pvArray.totalCurrentA > 40 ? "10mm²" : "6mm²",
    batteryCable: batteryCurrentA > 150 ? "50mm²" : batteryCurrentA > 100 ? "35mm²" : batteryCurrentA > 60 ? "25mm²" : "16mm²",
    dcBreakerA: Math.ceil(dcCurrentA * 1.25 / 10) * 10,
    acBreakerA: Math.ceil(acCurrentA * 1.25 / 10) * 10,
    pvFuseA: Math.ceil(pvArray.stringCurrentA * 1.56 / 5) * 5,
    inverterParallel,
    protectionItems: SHIL_SOLAR_PROTECTION_BANK
  };
}

export function runSolarAutoDesign({ load, environment, settings = {} }) {
  const normalized = normalizeLoad(load);
  const autonomyDays = Number(settings.autonomyDays || 1);
  const reserveFactor = Number(settings.reserveFactor || 1.2);
  const designPowerW = Math.ceil(normalized.totalPowerW * reserveFactor);
  const designSurgeW = Math.ceil(normalized.surgePowerW || designPowerW * 1.5);
  const psh = Number(environment?.peakSunHours || environment?.peakSunHour || 5.2);
  const thermalLoss = Number(environment?.temperatureDerating || environment?.environmentAssessment?.thermalDeratingPercent || 8) / 100;
  const soilingLoss = Number(environment?.soilingLossPercent || environment?.environmentAssessment?.soilingLossPercent || 5) / 100;
  const losses = clamp(0.86 - thermalLoss - soilingLoss, 0.55, 0.86);

  const inverterPick = chooseInverter(designPowerW, designSurgeW, settings.systemVoltage);
  const panel = choosePanel(settings.panelPowerW || 700);
  const requiredBatteryWh = normalized.totalEnergyWh * autonomyDays;
  const batteryDesign = chooseBattery(inverterPick.inverter.dcVoltage, requiredBatteryWh, settings.batteryVoltage);
  const pvArray = sizePvArray({ dailyWh: normalized.totalEnergyWh, psh, panel, inverter: inverterPick.inverter, losses, autonomyDays });
  const protection = sizeCableAndProtection({ inverter: inverterPick.inverter, inverterParallel: inverterPick.parallelCount, pvArray, batteryDesign, designPowerW });

  const warnings = [];
  if (!normalized.totalEnergyWh || normalized.totalEnergyWh <= 0) warnings.push("انرژی مصرفی معتبر نیست؛ ابتدا یکی از روش‌های محاسبات بار را تکمیل کنید.");
  if (!normalized.totalPowerW || normalized.totalPowerW <= 0) warnings.push("توان کل معتبر نیست؛ امکان انتخاب اینورتر وجود ندارد.");
  if (pvArray.arrayPowerW > inverterPick.inverter.maxPvPowerW * inverterPick.parallelCount) warnings.push("توان آرایه پنل از سقف ورودی PV اینورتر بیشتر است؛ تعداد اینورتر یا مدل اینورتر باید اصلاح شود.");
  if (inverterPick.parallelRequired && !inverterPick.inverter.parallelCapable) warnings.push("توان پروژه بیشتر از ظرفیت یک اینورتر است اما مدل انتخابی قابلیت پارالل ندارد.");

  const explanations = [
    `روزهای خودکفایی به صورت پیش‌فرض ${autonomyDays} روز در نظر گرفته شد و با تغییر آن، باتری و پنل دوباره محاسبه می‌شوند.`,
    `اینورتر ${inverterPick.inverter.title} انتخاب شد چون توان طراحی ${designPowerW} وات و توان راه‌اندازی ${designSurgeW} وات را پوشش می‌دهد.`,
    `باتری ${batteryDesign.battery.title} انتخاب شد چون ولتاژ آن با ولتاژ DC اینورتر (${inverterPick.inverter.dcVoltage}V) سازگار است.`,
    `تعداد باتری بیشتر برای تأمین انرژی مورد نیاز، عمق دشارژ مجاز و راندمان باتری پیشنهاد شد.`,
    `آرایش پنل ${pvArray.seriesCount} سری در ${pvArray.parallelCount} موازی انتخاب شد تا ولتاژ رشته داخل محدوده MPPT اینورتر بماند.`,
    `حفاظت‌های DC/AC، سرج ارسترها و کابل‌ها بر اساس جریان طراحی و ضریب اطمینان انتخاب شدند.`
  ];
  if (inverterPick.parallelRequired) explanations.push(`به دلیل بالا بودن توان، سیستم پیشنهاد پارالل ${inverterPick.parallelCount} عدد اینورتر را فعال کرده است.`);

  return {
    valid: warnings.length === 0,
    method: "solar-auto-design",
    load: normalized,
    settings: { autonomyDays, reserveFactor, systemType: settings.systemType || "offgrid" },
    inverter: { ...inverterPick.inverter, count: inverterPick.parallelCount, parallelRequired: inverterPick.parallelRequired },
    panel,
    pvArray,
    battery: batteryDesign,
    protection,
    losses: { psh, effectiveEfficiency: round(losses, 3), thermalLossPercent: round(thermalLoss * 100, 1), soilingLossPercent: round(soilingLoss * 100, 1) },
    warnings,
    explanations,
    nextBlockedReason: warnings[0] || ""
  };
}
