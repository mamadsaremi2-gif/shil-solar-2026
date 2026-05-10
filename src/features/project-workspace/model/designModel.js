import { EquipmentRepository } from "../../../data/repositories/EquipmentRepository";
import { IRAN_CITIES } from "../../../data/seed/iranCities";
import { SYSTEM_TYPES } from "../../../domain/models/project";
import { isBatteryVoltageCompatible, voltageCompatibilityMessage } from "../../../domain/engine/rules/engineeringRules";
import { parseFaNumber } from "../../../shared/utils/faNumbers";

export const DESIGN_STEPS = [
  "اطلاعات پروژه",
  "شرایط محیطی",
  "انتخاب مسیر پروژه",
  "روش محاسبات",
  "ورودی محاسبات",
  "تنظیمات سیستم",
  "چکیده اطلاعات",
  "اجرای محاسبات",
];

export const STEP_META = [
  { icon: "📋", title: "اطلاعات پروژه", hint: "نام پروژه، کارفرما و شهر" },
  { icon: "☀️", title: "شرایط محیطی", hint: "تابش، دما، زاویه و تلفات" },
  { icon: "🧭", title: "انتخاب مسیر", hint: "PV یا برق اضطراری" },
  { icon: "🧮", title: "روش محاسبات", hint: "جریان، توان، انرژی یا تجهیزات" },
  { icon: "⚡", title: "ورودی بار", hint: "نیاز مصرف و پروفایل بار" },
  { icon: "🔧", title: "تنظیمات سیستم", hint: "اینورتر، باتری، MPPT و کابل" },
  { icon: "📊", title: "چکیده اجرایی", hint: "مرور فنی قبل از محاسبه" },
  { icon: "📄", title: "خروجی نهایی", hint: "گزارش A4 و فایل PDF/PNG" },
];

export const PAGE_LOGO = "/icons/icon-512.png";
export const DASHBOARD_LOGO = "/icons/icon-512.png";

export const PV_TYPES = [
  { value: "gridtie", label: "آنگرید", desc: "متصل به شبکه برق، کاهش هزینه انرژی، بدون بانک باتری اصلی" },
  { value: "hybrid", label: "هیبرید", desc: "ترکیب پنل، باتری و شبکه برای مدیریت هوشمند انرژی" },
  { value: "offgrid", label: "آفگرید", desc: "مستقل از شبکه با پنل و باتری برای مناطق دورافتاده" },
];

export const METHOD_LABELS = {
  current: "جریان کل",
  power: "توان کل",
  loads: "لیست تجهیزات",
  daily_energy: "انرژی موردنیاز",
  load_profile: "پروفایل مصرف",
};

export const BATTERY_DOD = { LFP: 0.8, NMC: 0.75, GEL: 0.5, AGM: 0.5, Lithium: 0.8 };
export const SEASON_OPTIONS = [
  { value: "annual", label: "کل سال", factor: 1 },
  { value: "summer", label: "تابستانی", factor: 0.95 },
  { value: "winter", label: "زمستانی", factor: 0.9 },
  { value: "spring_autumn", label: "بهار/پاییز", factor: 0.85 },
  { value: "occasional", label: "مقطعی", factor: 0.55 },
];

export function n(value, fallback = 0) {
  const parsed = parseFaNumber(value, fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function effectiveGlobalCoincidence(form) {
  return ['current', 'power'].includes(form.calculationMode) ? Math.max(n(form.coincidenceFactor, 1), 0) : 1;
}

export function effectiveSeasonEnergyFactor(form) {
  return Math.max(n(form.seasonUsageFactor, 1), 0);
}

export function averageLoadFactor(items = [], key = 'coincidenceFactor', fallback = 1) {
  const active = (items || []).filter((item) => n(item.qty, 0) > 0 && n(item.power, 0) > 0);
  if (!active.length) return fallback;
  const weight = active.reduce((sum, item) => sum + n(item.qty, 1) * n(item.power, 0), 0) || 1;
  return active.reduce((sum, item) => sum + n(item.qty, 1) * n(item.power, 0) * n(item[key], fallback), 0) / weight;
}

export function batteryArrangementText(battery, form) {
  const unitV = n(form.batteryUnitVoltage, n(battery?.unitVoltage, 0));
  const unitAh = n(form.batteryUnitAh, n(battery?.unitAh, 0));
  const targetV = n(form.systemVoltage, 48);
  const series = Math.max(1, n(battery?.seriesCount, unitV ? Math.ceil(targetV / unitV) : 1));
  const parallel = Math.max(1, n(battery?.parallelCount, 1));
  if (series === 1 && parallel === 1) return 'یک باتری هم‌ولتاژ با بانک اینورتر؛ نیاز به سری/موازی‌سازی ندارد.';
  const parts = [];
  if (series > 1) parts.push(`${series} عدد باتری ${unitV || ''} ولت به صورت سری بسته شود تا ولتاژ بانک به حدود ${targetV} ولت برسد.`);
  if (parallel > 1) parts.push(`${parallel} شاخه موازی از همین رشته برای افزایش ظرفیت جریان‌ساعت استفاده شود.`);
  parts.push(`آرایش نهایی: ${series} سری × ${parallel} موازی.`);
  return parts.join(' ');
}

export function systemLabel(type) {
  if (type === "backup") return "برق اضطراری";
  return SYSTEM_TYPES.find((item) => item.value === type)?.label || "انتخاب نشده";
}

export function getCity(cityName) {
  return IRAN_CITIES.find((item) => item.name === cityName) || IRAN_CITIES.find((item) => item.name === "اصفهان") || IRAN_CITIES[0];
}

export function applyCityPatch(city, updateForm) {
  updateForm({
    city: city.name,
    sunHours: city.sunHours,
    averageTemperature: city.averageTemperature,
    minTemperature: city.minTemperature,
    maxTemperature: city.maxTemperature,
    altitude: city.altitude,
    tiltAngle: Math.round(Math.abs(city.latitude || 32)),
  });
}

export function profileEnergyKwh(form) {
  const total = n(form.profileMorningKwh) + n(form.profileNoonKwh) + n(form.profileEveningKwh) + n(form.profileNightKwh);
  return total > 0 ? total : n(form.dailyEnergyKwh, 10);
}

export function demandFromForm(form) {
  const isBackup = form.systemType === "backup";
  const energyFactor = isBackup ? 1 : effectiveSeasonEnergyFactor(form);
  if (form.calculationMode === "current") {
    const rawPowerW = n(form.current) * n(form.loadVoltage, 220) * n(form.powerFactor, 0.95);
    const powerW = rawPowerW * effectiveGlobalCoincidence(form);
    const hours = Math.max(isBackup ? n(form.backupHours, 0) : n(form.dailyUsageHours, 3), 0.1);
    return { powerW, dailyWh: powerW * hours * energyFactor, surgeW: rawPowerW * n(form.surgeFactor, 1.7) };
  }

  if (form.calculationMode === "power") {
    const rawPowerW = n(form.loadPower);
    const powerW = rawPowerW * effectiveGlobalCoincidence(form);
    const hours = Math.max(isBackup ? n(form.backupHours, 0) : n(form.dailyUsageHours, 3), 0.1);
    return { powerW, dailyWh: powerW * hours * energyFactor, surgeW: rawPowerW * n(form.surgeFactor, 1.7) };
  }

  if (form.calculationMode === "loads") {
    const items = form.loadItems || [];
    const powerW = items.reduce((sum, item) => sum + n(item.qty, 1) * n(item.power) * n(item.coincidenceFactor, 1), 0);
    const dailyWh = items.reduce((sum, item) => {
      const runtime = isBackup ? n(item.backupHours, n(form.backupHours, 0)) : n(item.hours, 1);
      const seasonal = isBackup ? 1 : n(item.seasonalUseFactor, 1);
      return sum + n(item.qty, 1) * n(item.power) * runtime * n(item.coincidenceFactor, 1) * seasonal;
    }, 0);
    const surgeW = items.reduce((sum, item) => sum + n(item.qty, 1) * n(item.power) * n(item.surgeFactor, 1) * n(item.coincidenceFactor, 1), 0);
    return { powerW, dailyWh, surgeW: Math.max(powerW, surgeW) };
  }

  if (form.calculationMode === "load_profile") {
    const baseKw = profileEnergyKwh(form);
    const peak = (form.loadProfile || []).reduce((max, item) => Math.max(max, n(item.factor, 0)), 0);
    const dailyWh = baseKw * 1000 * energyFactor;
    return { powerW: Math.max(dailyWh / 8, 1), dailyWh, surgeW: Math.max(dailyWh / 8, 1) * Math.max(peak, n(form.peakFactor, 2)) };
  }

  const dailyWh = n(form.dailyEnergyKwh, 0) * 1000 * energyFactor;
  const hours = Math.max(n(form.dailyUsageHours, n(form.backupHours, 3)), 1);
  const powerW = Math.max(dailyWh / hours, dailyWh / 24, 1);
  return { powerW, dailyWh, surgeW: powerW * n(form.peakFactor, 2) };
}

export function batteryPriorityScore(battery, targetVoltage = 48) {
  const v = n(battery?.specs?.batteryUnitVoltage, 0);
  const ah = n(battery?.specs?.batteryUnitAh, 0);
  if (targetVoltage >= 42 && targetVoltage <= 60) {
    if (v >= 48 && v <= 52.5) return 0 + Math.abs(51.2 - v) / 10 - ah / 100000;
    if (v >= 24 && v <= 26.5) return 10 + Math.abs(25.6 - v) / 10 - ah / 100000;
    if (v >= 12 && v <= 13.2) return 20 + Math.abs(12.8 - v) / 10 - ah / 100000;
  }
  return Math.abs(targetVoltage - v) + 30 - ah / 100000;
}

export function recommendation(form) {
  const demand = demandFromForm(form);
  const requiredW = Math.max(demand.powerW * n(form.designFactor, 1.2), demand.surgeW, 1);
  const selected = form.selectedEquipment || {};
  const selectedInverter = selected.inverter ? EquipmentRepository.getById(selected.inverter) : null;
  const selectedPanel = selected.panel ? EquipmentRepository.getById(selected.panel) : null;
  const selectedBattery = selected.battery ? EquipmentRepository.getById(selected.battery) : null;
  const inverters = EquipmentRepository.search({ category: "inverter", query: "" })
    .filter((item) => {
      if (["backup", "offgrid"].includes(form.systemType)) return item.specs?.inverterMode === "offgrid" || item.specs?.inverterMode === "hybrid";
      if (form.systemType === "hybrid") return item.specs?.inverterMode === "hybrid" || item.specs?.inverterMode === "offgrid";
      return true;
    })
    .sort((a, b) => n(a.specs?.ratedPowerW) - n(b.specs?.ratedPowerW));
  const inverter = selectedInverter || inverters.find((item) => n(item.specs?.ratedPowerW) >= requiredW) || inverters.at(-1) || null;
  const panels = EquipmentRepository.search({ category: "panel", query: "" }).sort((a, b) => n(a.specs?.panelWatt) - n(b.specs?.panelWatt));
  const panel = selectedPanel || panels.find((item) => n(item.specs?.panelWatt) >= n(form.panelWatt, 550)) || panels.at(-1) || null;
  const targetBatteryVoltage = n(inverter?.specs?.systemVoltage, n(form.systemVoltage, 48));
  const batteries = EquipmentRepository.search({ category: "battery", query: "" })
    .sort((a, b) => batteryPriorityScore(a, targetBatteryVoltage) - batteryPriorityScore(b, targetBatteryVoltage));
  const battery = selectedBattery || batteries.find((item) => n(item.specs?.batteryUnitAh) >= n(form.batteryUnitAh, 100)) || batteries[0] || null;
  const panelWatt = n(panel?.specs?.panelWatt, n(form.panelWatt, 550));
  const batteryVoltage = n(battery?.specs?.batteryUnitVoltage, n(form.batteryUnitVoltage, n(form.systemVoltage, 48)));
  const batteryAh = n(battery?.specs?.batteryUnitAh, n(form.batteryUnitAh, 100));
  const seasonalDerate = form.systemType === "backup" ? 1 : (n(form.seasonalDerate, form.city === "رشت" ? 0.84 : 0.9));
  const pvCount = Math.max(1, Math.ceil(demand.dailyWh / Math.max(n(form.sunHours, 5.5) * panelWatt * n(form.panelLossFactor, 0.9) * n(form.shadingFactor, 0.95) * n(form.dustFactor, 0.96) * seasonalDerate, 1)));
  const nightReserveWh = form.systemType === "backup" ? demand.dailyWh : Math.max(demand.dailyWh * 0.42, demand.powerW * 2);
  const autonomyWh = demand.dailyWh * Math.max(0, n(form.daysAutonomy, 0));
  const batteryCount = Math.max(1, Math.ceil((nightReserveWh + autonomyWh) * Math.max(1, n(form.batteryFactor, 1)) / Math.max(batteryVoltage * batteryAh * n(form.dod, 0.8), 1)));
  const inverterLimitW = Math.max(...inverters.map((item) => n(item.specs?.ratedPowerW, 0)), 0);
  const hybridParallelCandidates = EquipmentRepository.search({ category: "inverter", query: "" }).filter((item) => item.specs?.inverterMode === "hybrid");
  const bestHybrid = hybridParallelCandidates.sort((a,b)=>n(b.specs?.ratedPowerW)-n(a.specs?.ratedPowerW))[0] || null;
  const hybridParallelCount = bestHybrid ? Math.ceil(requiredW / Math.max(n(bestHybrid.specs?.ratedPowerW), 1)) : 0;
  return { demand, requiredW, inverter, panel, battery, pvCount, batteryCount, inverters, panels, batteries, inverterLimitW, bestHybrid, hybridParallelCount };
}

export function buildRecoveryPlan(form) {
  const rec = recommendation(form);
  const requiredKw = Math.ceil(rec.requiredW / 1000);
  const selectedInverterW = n(rec.inverter?.specs?.ratedPowerW, 0);
  const selectedSurgeW = n(rec.inverter?.specs?.surgePowerW, selectedInverterW * 2);
  const hasPowerShortfall = selectedInverterW > 0 && selectedInverterW < rec.demand.powerW;
  const hasSurgeShortfall = selectedSurgeW > 0 && selectedSurgeW < rec.demand.surgeW;
  const needsRecovery = hasPowerShortfall || hasSurgeShortfall || (selectedInverterW > 0 && rec.requiredW > selectedInverterW);
  const hybrid = rec.bestHybrid || rec.inverter;
  const unitW = n(hybrid?.specs?.ratedPowerW, 0) || selectedInverterW || 1;
  const unitSurgeW = n(hybrid?.specs?.surgePowerW, unitW * 2);
  const countByPower = Math.ceil(rec.requiredW / Math.max(unitW, 1));
  const countBySurge = Math.ceil(rec.demand.surgeW / Math.max(unitSurgeW, 1));
  const parallelCount = Math.max(1, countByPower, countBySurge);
  const maxParallel = Math.max(parallelCount, n(hybrid?.specs?.maxParallelUnits, parallelCount));
  const systemVoltage = n(hybrid?.specs?.systemVoltage, n(form.systemVoltage, 48));
  const mpptCount = n(hybrid?.specs?.mpptCount, n(form.mpptCount, 1)) * parallelCount;
  const maxPvPowerW = n(hybrid?.specs?.maxPvPowerW, n(form.maxPvPowerW, 0)) * parallelCount;
  const maxPvPowerPerMpptW = n(hybrid?.specs?.maxPvPowerPerMpptW, n(form.maxPvPowerPerMpptW, 0));
  const options = [];
  if (hybrid) {
    options.push({
      id: 'parallel-hybrid',
      title: `پارالل ${parallelCount} عدد ${hybrid.title}`,
      badge: 'پیشنهاد اصلی اپ',
      description: `توان موردنیاز از بانک فعلی بیشتر است. توان پیشنهادی اینورتر جدید حدود ${requiredKw} کیلووات است؛ گزینه جایگزین مهندسی: ${hybrid.title} به تعداد ${parallelCount} عدد به صورت پارالل.`,
      patch: {
        selectedEquipment: { ...(form.selectedEquipment || {}), inverter: hybrid.id },
        inverterRatedPowerW: unitW,
        inverterAcPowerW: unitW,
        inverterUnitSurgeW: unitSurgeW,
        inverterParallelCapable: true,
        maxParallelInverters: maxParallel,
        requestedParallelInverters: parallelCount,
        inverterParallelDesignCount: parallelCount,
        systemVoltage,
        inverterEfficiency: hybrid.specs?.inverterEfficiency || form.inverterEfficiency || 0.95,
        maxPvVocV: hybrid.specs?.maxPvVocV || form.maxPvVocV,
        controllerMaxVoc: hybrid.specs?.controllerMaxVoc || hybrid.specs?.maxPvVocV || form.controllerMaxVoc,
        mpptMinVoltage: hybrid.specs?.mpptMinVoltage || form.mpptMinVoltage,
        mpptMaxVoltage: hybrid.specs?.mpptMaxVoltage || form.mpptMaxVoltage,
        mpptStartupVoltage: hybrid.specs?.mpptStartupVoltage || hybrid.specs?.mpptMinVoltage || form.mpptStartupVoltage,
        mpptCount,
        maxPvPowerPerMpptW,
        maxPvPowerW,
        engineeringRecoveryChoice: 'parallel-hybrid',
        engineeringRecoveryApplied: true,
      },
    });
  }

  const industrialCandidates = EquipmentRepository.search({ category: "inverter", query: "" })
    .filter((item) => n(item.specs?.ratedPowerW, 0) >= 20000 || item.specs?.inverterGrade === "industrial")
    .sort((a, b) => n(a.specs?.ratedPowerW, 0) - n(b.specs?.ratedPowerW, 0));
  const industrial = industrialCandidates.find((item) => n(item.specs?.ratedPowerW, 0) >= rec.requiredW / 4) || industrialCandidates.at(-1);
  if (industrial && industrial.id !== hybrid?.id) {
    const indW = n(industrial.specs?.ratedPowerW, unitW);
    const indSurge = n(industrial.specs?.surgePowerW, indW * 1.8);
    const indCount = Math.max(1, Math.ceil(rec.requiredW / Math.max(indW, 1)), Math.ceil(rec.demand.surgeW / Math.max(indSurge, 1)));
    options.push({
      id: 'industrial-bank',
      title: `${indCount} عدد ${industrial.title}`,
      badge: 'پیشنهاد صنعتی',
      description: `گزینه صنعتی بر اساس بانک تجهیزات: ${industrial.title} به تعداد ${indCount} عدد. این مسیر برای کاهش تعداد واحدها، کابل‌کشی منظم‌تر و تابلو صنعتی مناسب‌تر است.`,
      patch: {
        selectedEquipment: { ...(form.selectedEquipment || {}), inverter: industrial.id },
        inverterRatedPowerW: indW,
        inverterAcPowerW: indW,
        inverterUnitSurgeW: indSurge,
        inverterParallelCapable: indCount > 1,
        maxParallelInverters: Math.max(indCount, n(industrial.specs?.maxParallelUnits, indCount)),
        requestedParallelInverters: indCount,
        inverterParallelDesignCount: indCount,
        systemVoltage: n(industrial.specs?.systemVoltage, systemVoltage),
        inverterEfficiency: industrial.specs?.inverterEfficiency || form.inverterEfficiency || 0.95,
        maxPvVocV: industrial.specs?.maxPvVocV || form.maxPvVocV,
        controllerMaxVoc: industrial.specs?.controllerMaxVoc || industrial.specs?.maxPvVocV || form.controllerMaxVoc,
        mpptMinVoltage: industrial.specs?.mpptMinVoltage || form.mpptMinVoltage,
        mpptMaxVoltage: industrial.specs?.mpptMaxVoltage || form.mpptMaxVoltage,
        mpptStartupVoltage: industrial.specs?.mpptStartupVoltage || industrial.specs?.mpptMinVoltage || form.mpptStartupVoltage,
        mpptUnitCount: n(industrial.specs?.mpptCount, 1),
        mpptCount: n(industrial.specs?.mpptCount, 1) * indCount,
        maxPvPowerPerMpptW: industrial.specs?.maxPvPowerPerMpptW || form.maxPvPowerPerMpptW,
        maxPvPowerW: n(industrial.specs?.maxPvPowerW, 0) * indCount,
        engineeringRecoveryChoice: 'industrial-bank',
        engineeringRecoveryApplied: true,
      },
    });
  }
  if (parallelCount >= 4) {
    const half = Math.ceil(parallelCount / 2);
    options.push({
      id: 'distributed-two-clusters',
      title: `دو خوشه مستقل ${half} تایی`,
      badge: 'معماری توزیع‌شده',
      description: `بار بین دو خوشه مستقل تقسیم می‌شود تا نگهداری، عیب‌یابی، کابل‌کشی و افزونگی بهتر شود. هر خوشه حدود ${Math.ceil(requiredKw / 2)} کیلووات را پوشش می‌دهد.`,
      patch: {
        selectedEquipment: { ...(form.selectedEquipment || {}), inverter: hybrid?.id || form.selectedEquipment?.inverter },
        inverterRatedPowerW: unitW,
        inverterAcPowerW: unitW,
        inverterUnitSurgeW: unitSurgeW,
        inverterParallelCapable: true,
        requestedParallelInverters: parallelCount,
        inverterParallelDesignCount: parallelCount,
        distributedClusterCount: 2,
        invertersPerCluster: half,
        systemVoltage,
        mpptUnitCount: n(hybrid?.specs?.mpptCount, 1),
        mpptCount,
        maxPvPowerPerMpptW,
        maxPvPowerW,
        engineeringRecoveryChoice: 'distributed-two-clusters',
        engineeringRecoveryApplied: true,
      },
    });
  }
  options.push({
    id: 'custom-industrial',
    title: `تعریف اینورتر صنعتی حدود ${requiredKw}kW`,
    badge: 'برای کاربر حرفه‌ای',
    description: `اگر در اجرا اینورتر صنعتی یا چند سیستم مستقل دارید، توان نامی را روی حدود ${requiredKw} کیلووات تنظیم کنید و سپس کابل، حفاظت، باتری و پنل با همین مبنا دوباره محاسبه می‌شود.`,
    patch: {
      inverterRatedPowerW: rec.requiredW,
      inverterAcPowerW: rec.requiredW,
      inverterUnitSurgeW: Math.max(rec.demand.surgeW, rec.requiredW * 1.5),
      inverterParallelCapable: true,
      maxParallelInverters: 1,
      requestedParallelInverters: 1,
      inverterParallelDesignCount: 1,
      engineeringRecoveryChoice: 'custom-industrial',
      engineeringRecoveryApplied: true,
    },
  });
  return {
    needsRecovery,
    hasPowerShortfall,
    hasSurgeShortfall,
    requiredKw,
    selectedInverterW,
    selectedSurgeW,
    suggested: options[0],
    options,
    decisionText: needsRecovery
      ? 'بار پروژه از ظرفیت ایمن یک واحد عبور کرده است. قبل از ادامه، بار باید بین چند اینورتر/بانک باتری تقسیم شود یا اینورتر صنعتی مناسب تعریف گردد.'
      : 'طراحی فعلی از نظر توان پیوسته و لحظه‌ای قابل ادامه است.',
  };
}

export function validate(form, step) {
  const errors = [];
  if (step === 0) {
    if (!String(form.projectTitle || "").trim()) errors.push("نام پروژه را وارد کنید.");
    if (!String(form.clientName || "").trim()) errors.push("نام کارفرما را وارد کنید.");
    if (!String(form.city || "").trim()) errors.push("شهر اجرای پروژه را انتخاب کنید.");
  }
  if (step === 2) {
    if (!String(form.systemType || "").trim()) errors.push("مسیر پروژه را انتخاب کنید: آفگرید، آنگرید، هیبرید یا برق اضطراری.");
  }
  if (step === 3) {
    if (!String(form.calculationMode || "").trim()) errors.push("روش محاسبات را انتخاب کنید.");
  }
  if (step === 4) {
    if (form.calculationMode === "current" && n(form.current) <= 0) errors.push("جریان کل را وارد کنید.");
    if (form.calculationMode === "power" && n(form.loadPower) <= 0) errors.push("توان کل را وارد کنید.");
    if (["daily_energy", "load_profile"].includes(form.calculationMode) && n(form.dailyEnergyKwh) <= 0) errors.push("انرژی موردنیاز را وارد کنید.");
    if (form.calculationMode === "loads" && !(form.loadItems || []).length) errors.push("حداقل یک تجهیز انتخاب کنید.");
    if (["current", "power"].includes(form.calculationMode) && n(form.loadVoltage) <= 0) errors.push("ولتاژ مصرف‌کننده را وارد کنید.");
    if (["current", "power"].includes(form.calculationMode) && n(form.powerFactor) <= 0) errors.push("ضریب توان را وارد کنید.");
    if (form.systemType !== "backup" && ["current", "power"].includes(form.calculationMode) && n(form.dailyUsageHours) <= 0) errors.push("زمان مصرف روزانه برای محاسبه کل پروژه را وارد کنید.");
    if (form.systemType === "backup" && ["current", "power", "daily_energy", "load_profile", "loads"].includes(form.calculationMode) && n(form.backupHours) <= 0) errors.push("مدت زمان برق اضطراری موردنیاز را وارد کنید.");
  }
  if (step === 1 && form.systemType !== "backup") {
    ["sunHours", "shadingFactor", "dustFactor", "tiltAngle", "altitude"].forEach((key) => {
      if (String(form[key] ?? "").trim() === "") errors.push("ضرایب اثرگذار شرایط محیطی نباید خالی باشند.");
    });
  }
  if (step === 5) {
    const rec = recommendation(form);
    const invW = n(rec.inverter?.specs?.ratedPowerW, 0);
    const invSurge = n(rec.inverter?.specs?.surgePowerW, invW * 2);
    if (!form.engineeringRecoveryApplied) {
      if (invW && invW < rec.demand.powerW) errors.push("توان پیوسته اینورتر انتخاب‌شده کمتر از نیاز پروژه است. اینورتر قوی‌تر انتخاب کنید.");
      if (invSurge && invSurge < rec.demand.surgeW) errors.push("توان لحظه‌ای/راه‌اندازی اینورتر برای تجهیزات موتوری کافی نیست.");
    }
    if (["offgrid", "backup", "hybrid"].includes(form.systemType)) {
      const invV = n(rec.inverter?.specs?.systemVoltage, n(form.systemVoltage, 48));
      const batV = n(rec.battery?.specs?.batteryUnitVoltage, n(form.batteryUnitVoltage, invV));
      if (invV && batV && !isBatteryVoltageCompatible(invV, batV)) errors.push(voltageCompatibilityMessage(invV, batV));
    }
  }
  return [...new Set(errors)];
}
