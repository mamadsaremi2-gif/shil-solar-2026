const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};

const round = (value, digits = 2) => Number(num(value, 0).toFixed(digits));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));
const ceil = (value) => Math.max(0, Math.ceil(num(value, 0)));

function levelFromScore(score) {
  if (score >= 88) return "excellent";
  if (score >= 74) return "acceptable";
  if (score >= 55) return "review";
  return "risk";
}

function labelFromLevel(level) {
  return {
    excellent: "طراحی مطلوب",
    acceptable: "قابل قبول",
    review: "نیازمند بازبینی",
    risk: "ریسک مهندسی بالا"
  }[level] || "نیازمند بررسی";
}

export function runSolarPanelPowerEngine({
  panel = {},
  pvArray = {},
  inverter = {},
  inverterCount = 1,
  env = {},
  load = {},
  solarSizing = {},
  settings = {}
} = {}) {
  const panelPowerW = num(panel.powerW, num(solarSizing?.input?.P_panel, 620));
  const panelCount = ceil(pvArray.panelCount ?? solarSizing?.input?.N_panel);
  const seriesCount = Math.max(1, ceil(pvArray.seriesCount || 1));
  const parallelCount = Math.max(1, ceil(pvArray.parallelCount || Math.ceil(panelCount / seriesCount) || 1));
  const psh = clamp(env.psh ?? solarSizing?.input?.PSH, 0, 9);
  const effectiveEfficiency = clamp(env.effectiveEfficiency ?? (1 - num(solarSizing?.input?.lossRatio, 0.18)), 0.35, 0.98);
  const totalEnergyWh = Math.max(0, num(load.totalEnergyWh, num(solarSizing?.eLoadDailyKWh, 0) * 1000));
  const dailyLoadKWh = totalEnergyWh / 1000;
  const isPlantTargetMode = num(settings.targetPlantPowerMW, 0) > 0 || num(settings.targetPlantPowerKW, 0) > 0 || num(settings.targetDesignPowerW, 0) > 0;
  const arrayPowerW = panelCount * panelPowerW;
  const arrayPowerKW = arrayPowerW / 1000;
  const ePvDailyKWh = arrayPowerKW * psh * effectiveEfficiency;
  const coveragePercent = !isPlantTargetMode && dailyLoadKWh > 0 ? (ePvDailyKWh / dailyLoadKWh) * 100 : null;
  const targetPanelCount100 = dailyLoadKWh > 0 && panelPowerW > 0 && psh > 0
    ? Math.ceil((dailyLoadKWh * 1000) / (panelPowerW * psh * effectiveEfficiency))
    : 0;
  const targetPanelCount120 = dailyLoadKWh > 0 && panelPowerW > 0 && psh > 0
    ? Math.ceil((dailyLoadKWh * 1.2 * 1000) / (panelPowerW * psh * effectiveEfficiency))
    : 0;

  const panelAreaM2 = Math.max(0, num(panel.areaM2, 0));
  const arrayAreaM2 = panelAreaM2 * panelCount;
  const maintenanceAreaM2 = arrayAreaM2 * 1.25;
  const powerDensityWm2 = panelAreaM2 > 0 ? panelPowerW / panelAreaM2 : null;
  const moduleEfficiencyPercent = panel.efficiency ? num(panel.efficiency, 0) * 100 : (powerDensityWm2 ? powerDensityWm2 / 10 : null);

  const voc = num(panel.voc, 0);
  const vmp = num(panel.vmp, 0);
  const imp = num(panel.imp, panelPowerW && vmp ? panelPowerW / vmp : 0);
  const isc = num(panel.isc, imp ? imp * 1.08 : 0);
  const minTempC = num(env.minTempC, -5);
  const maxTempC = num(env.maxTempC, 45);
  const vocTempCoeff = Math.abs(num(panel.tempCoeffVocPercentPerC ?? settings.tempCoeffVocPercentPerC, 0.28)) / 100;
  const vmpTempCoeff = Math.abs(num(panel.tempCoeffPmaxPercentPerC ?? settings.tempCoeffPmaxPercentPerC, 0.35)) / 100;
  const coldVocFactor = 1 + Math.max(0, 25 - minTempC) * vocTempCoeff;
  const hotVmpFactor = 1 - Math.max(0, maxTempC - 25) * vmpTempCoeff;
  const coldStringVoc = voc * seriesCount * coldVocFactor;
  const hotStringVmp = vmp * seriesCount * hotVmpFactor;
  const nominalStringVmp = vmp * seriesCount;
  const stringImp = imp;
  const arrayImp = imp * parallelCount;
  const arrayIsc = isc * parallelCount;

  const mpptMinV = num(inverter.mpptMinV ?? inverter.mpptMinVoltage, 0);
  const mpptMaxV = num(inverter.mpptMaxV ?? inverter.mpptMaxVoltage, 0);
  const maxDcVoltage = num(inverter.maxDcVoltage, mpptMaxV || 0);
  const maxPvPowerW = num(inverter.maxPvPowerW, 0) * Math.max(1, num(inverterCount, 1));
  const mpptVoltageOk = mpptMinV > 0 && mpptMaxV > 0 ? hotStringVmp >= mpptMinV && coldStringVoc <= mpptMaxV : true;
  const dcVoltageOk = maxDcVoltage > 0 ? coldStringVoc <= maxDcVoltage : true;
  const pvInputPowerRatio = maxPvPowerW > 0 ? arrayPowerW / maxPvPowerW : null;
  const pvInputPowerOk = pvInputPowerRatio === null ? true : pvInputPowerRatio <= 1.05;
  const stringBalanceOk = panelCount === seriesCount * parallelCount;

  const specificYieldKWhPerKWp = arrayPowerKW > 0 ? ePvDailyKWh / arrayPowerKW : 0;
  const requiredAdditionalPanelsFor100 = targetPanelCount100 > panelCount ? targetPanelCount100 - panelCount : 0;
  const suggestedReductionPanelsFor140 = coveragePercent && coveragePercent > 140 && targetPanelCount120 > 0 ? Math.max(0, panelCount - targetPanelCount120) : 0;

  const checks = [
    {
      code: "PANEL_POWER_RANGE",
      ok: panelPowerW >= 300 && panelPowerW <= 750,
      level: panelPowerW >= 300 && panelPowerW <= 750 ? "ok" : "warning",
      title: "توان نامی پنل در بازه مهندسی",
      message: `${round(panelPowerW, 0)} وات برای هر پنل ثبت شده است.`,
      fix: "توان هر پنل را از دیتاشیت معتبر وارد کنید."
    },
    {
      code: "PANEL_COUNT_VALID",
      ok: panelCount > 0,
      level: panelCount > 0 ? "ok" : "error",
      title: "تعداد پنل معتبر",
      message: `${panelCount.toLocaleString("fa-IR")} پنل در آرایه استفاده شده است.`,
      fix: "تعداد پنل باید بزرگ‌تر از صفر باشد."
    },
    {
      code: "PV_DAILY_COVERAGE",
      ok: coveragePercent === null || coveragePercent >= 100,
      level: coveragePercent === null ? "info" : coveragePercent >= 100 ? "ok" : coveragePercent >= 80 ? "warning" : "error",
      title: "پوشش انرژی روزانه",
      message: coveragePercent === null ? "مصرف روزانه هنوز برای مقایسه کامل ثبت نشده است." : `آرایه فعلی حدود ${round(coveragePercent, 1)}٪ از مصرف روزانه را پوشش می‌دهد.`,
      fix: requiredAdditionalPanelsFor100 > 0 ? `برای رسیدن به پوشش کامل، حدود ${requiredAdditionalPanelsFor100.toLocaleString("fa-IR")} پنل دیگر با همین توان لازم است.` : "حاشیه فصلی و شرایط محیطی کنترل شود."
    },
    {
      code: "MPPT_VOLTAGE_WINDOW",
      ok: mpptVoltageOk,
      level: mpptVoltageOk ? "ok" : "error",
      title: "سازگاری ولتاژ رشته با MPPT",
      message: `Vmp گرم رشته ${round(hotStringVmp, 1)}V و Voc سرد رشته ${round(coldStringVoc, 1)}V محاسبه شد.`,
      fix: "تعداد پنل سری را طوری اصلاح کنید که Vmp در بازه MPPT و Voc زیر سقف ولتاژ بماند."
    },
    {
      code: "PV_INPUT_POWER_LIMIT",
      ok: pvInputPowerOk,
      level: pvInputPowerOk ? "ok" : "warning",
      title: "سازگاری توان آرایه با ورودی PV اینورتر",
      message: pvInputPowerRatio === null ? "سقف توان PV اینورتر برای مقایسه ثبت نشده است." : `نسبت توان آرایه به سقف ورودی PV حدود ${round(pvInputPowerRatio * 100, 1)}٪ است.`,
      fix: "توان ورودی مجاز اینورتر یا تعداد پنل موازی بازبینی شود."
    },
    {
      code: "STRING_BALANCE",
      ok: stringBalanceOk,
      level: stringBalanceOk ? "ok" : "warning",
      title: "تعادل آرایش سری و موازی",
      message: `${seriesCount.toLocaleString("fa-IR")} سری × ${parallelCount.toLocaleString("fa-IR")} موازی برای آرایه ثبت شده است.`,
      fix: "تعداد کل پنل بهتر است مضرب صحیحی از تعداد سری باشد تا رشته ناقص ایجاد نشود."
    }
  ];

  const penalty = checks.reduce((sum, item) => {
    if (item.ok) return sum;
    if (item.level === "error") return sum + 22;
    if (item.level === "warning") return sum + 9;
    return sum + 0;
  }, 0);
  const score = clamp(100 - penalty, 0, 100);
  const level = levelFromScore(score);

  const messages = [
    `توان پیک DC آرایه ${round(arrayPowerKW, 2)} کیلووات است.`,
    `تولید روزانه مهندسی با شرایط فعلی حدود ${round(ePvDailyKWh, 2)} کیلووات‌ساعت برآورد می‌شود.`,
    coveragePercent === null ? "برای محاسبه درصد پوشش، مصرف روزانه باید ثبت شود." : `درصد پوشش مصرف روزانه ${round(coveragePercent, 1)}٪ است.`,
    `آرایش الکتریکی پنل‌ها ${seriesCount.toLocaleString("fa-IR")} سری × ${parallelCount.toLocaleString("fa-IR")} موازی است.`
  ];

  const recommendations = checks
    .filter((item) => !item.ok && item.fix)
    .map((item) => item.fix);
  if (!recommendations.length && suggestedReductionPanelsFor140 > 0) {
    recommendations.push(`برای جلوگیری از بزرگ‌نمایی غیرضروری، امکان کاهش حدود ${suggestedReductionPanelsFor140.toLocaleString("fa-IR")} پنل قابل بررسی است؛ فقط اگر توسعه آینده یا افت زمستانی مدنظر نیست.`);
  }
  if (!recommendations.length) recommendations.push("بخش توان پنل خورشیدی از نظر توان، انرژی، آرایش رشته و محدوده MPPT قابل قبول است.");

  return {
    score,
    level,
    levelLabel: labelFromLevel(level),
    status: checks.some((item) => item.level === "error" && !item.ok) ? "error" : checks.some((item) => item.level === "warning" && !item.ok) ? "warning" : "ok",
    input: { panelPowerW, panelCount, seriesCount, parallelCount, psh, effectiveEfficiency, dailyLoadKWh },
    array: {
      powerW: round(arrayPowerW, 0),
      powerKW: round(arrayPowerKW, 2),
      dailyEnergyKWh: round(ePvDailyKWh, 2),
      specificYieldKWhPerKWp: round(specificYieldKWhPerKWp, 2),
      coveragePercent: coveragePercent === null ? null : round(coveragePercent, 1),
      targetPanelCount100,
      targetPanelCount120,
      requiredAdditionalPanelsFor100,
      suggestedReductionPanelsFor140
    },
    physical: {
      panelAreaM2: round(panelAreaM2, 2),
      arrayAreaM2: round(arrayAreaM2, 2),
      maintenanceAreaM2: round(maintenanceAreaM2, 2),
      powerDensityWm2: powerDensityWm2 === null ? null : round(powerDensityWm2, 1),
      moduleEfficiencyPercent: moduleEfficiencyPercent === null ? null : round(moduleEfficiencyPercent, 1)
    },
    electrical: {
      panelVoc: round(voc, 2),
      panelVmp: round(vmp, 2),
      panelImp: round(imp, 2),
      panelIsc: round(isc, 2),
      stringVmp: round(nominalStringVmp, 1),
      hotStringVmp: round(hotStringVmp, 1),
      coldStringVoc: round(coldStringVoc, 1),
      stringImp: round(stringImp, 2),
      arrayImp: round(arrayImp, 2),
      arrayIsc: round(arrayIsc, 2),
      mpptMinV: round(mpptMinV, 1),
      mpptMaxV: round(mpptMaxV, 1),
      maxDcVoltage: round(maxDcVoltage, 1),
      maxPvPowerW: round(maxPvPowerW, 0),
      pvInputPowerRatio: pvInputPowerRatio === null ? null : round(pvInputPowerRatio, 3)
    },
    checks,
    messages,
    recommendations
  };
}
