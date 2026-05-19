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

const SEVERITY_WEIGHT = { critical: 28, error: 22, warning: 9, info: 0, ok: 0 };
const SEVERITY_LABEL = {
  critical: "بحرانی",
  error: "خطا",
  warning: "هشدار",
  info: "اطلاع",
  ok: "تأیید"
};

function buildItem({ code, title, severity = "info", category = "general", message, recommendation = "", technical = "", value = null, target = null }) {
  return {
    code,
    title,
    severity,
    severityLabel: SEVERITY_LABEL[severity] || "اطلاع",
    category,
    message,
    recommendation,
    technical,
    value,
    target
  };
}

function classifyCoverage(coveragePercent) {
  if (coveragePercent === null || coveragePercent === undefined) return "unknown";
  if (coveragePercent >= 120) return "oversized";
  if (coveragePercent >= 100) return "complete";
  if (coveragePercent >= 80) return "near";
  if (coveragePercent >= 50) return "partial";
  return "critical";
}

export function runSolarProfessionalDiagnostics({
  load = {},
  env = {},
  settings = {},
  design = {},
  panel = {},
  inverter = {},
  inverterCount = 1,
  pvArray = {},
  battery = {},
  protection = {},
  solarSizing = {},
  validation = {},
  panelPowerAnalysis = {},
  systemScale = {},
  utilityElectrical = {},
  enterpriseUtility = {}
} = {}) {
  const items = [];
  const add = (item) => items.push(buildItem(item));

  const totalPowerW = num(load.totalPowerW, 0);
  const surgePowerW = num(load.surgePowerW, totalPowerW);
  const totalEnergyWh = num(load.totalEnergyWh, 0);
  const designPowerW = num(design.designPowerW, totalPowerW);
  const designSurgeW = num(design.designSurgeW, surgePowerW);
  const autonomyDays = num(settings.autonomyDays, 1);
  const psh = num(env.psh, solarSizing?.input?.PSH || 0);
  const effectiveEfficiency = num(env.effectiveEfficiency, 1 - num(solarSizing?.input?.lossRatio, 0.18));
  const coveragePercent = systemScale?.targetPowerMW > 0 ? null : (solarSizing.coveragePercent ?? null);
  const coverageClass = classifyCoverage(coveragePercent);
  const arrayPowerW = num(pvArray.arrayPowerW, num(solarSizing.pArrayW, 0));
  const requiredPvW = num(pvArray.requiredPvW, 0);
  const inverterRatedTotalW = num(inverter.ratedPowerW, 0) * Math.max(1, num(inverterCount, 1));
  const inverterSurgeTotalW = num(inverter.surgePowerW, 0) * Math.max(1, num(inverterCount, 1));
  const maxPvPowerW = num(inverter.maxPvPowerW, 0) * Math.max(1, num(inverterCount, 1));
  const batteryUsableWh = num(battery.usableEnergyWh, 0);
  const batteryGrossWh = num(battery.grossEnergyWh, 0);
  const requiredBatteryWh = num(design.requiredBatteryWh, 0);
  const panelPowerScore = num(panelPowerAnalysis.score, 0);


  if (systemScale.designMode === "block_based_power_plant") {
    add({
      code: "UTILITY_SCALE_BLOCK_MODE",
      title: "حالت نیروگاهی فعال است",
      severity: systemScale.targetPowerMW > systemScale.maxSupportedPowerMW ? "error" : "info",
      category: "system-scale",
      message: `پروژه در مقیاس ${systemScale.scaleLabel || "نیروگاهی"} با ${systemScale.blockCount || 1} بلوک توان تحلیل می‌شود.`,
      recommendation: "هر بلوک از نظر String، MPPT، حفاظت DC/AC، تابلو تجمیع و کابل‌کشی جداگانه بازبینی شود.",
      technical: `mode=${systemScale.designMode}; target=${systemScale.targetPowerMW}MW; blocks=${systemScale.blockCount}`,
      value: systemScale.targetPowerMW,
      target: `<= ${systemScale.maxSupportedPowerMW || 30}MW`
    });
  } else if (systemScale.designMode === "multi_inverter") {
    add({
      code: "MULTI_INVERTER_MODE",
      title: "حالت چند اینورتری فعال است",
      severity: "info",
      category: "system-scale",
      message: `ظرفیت پروژه با ${systemScale.totalInverterCount || inverterCount} اینورتر موازی تحلیل می‌شود.`,
      recommendation: "تقسیم بار، حفاظت خروجی، سنکرون‌سازی و توزیع رشته‌ها بین اینورترها کنترل شود.",
      technical: `mode=${systemScale.designMode}; inverters=${systemScale.totalInverterCount || inverterCount}`
    });
  }



  if (utilityElectrical.active) {
    add({
      code: "UTILITY_ELECTRICAL_LAYER_ACTIVE",
      title: "لایه برق نیروگاهی فعال است",
      severity: "info",
      category: "utility-electrical",
      message: `تحلیل MV، ترانس، بلوک اینورتر، زمین، تولید سالانه و اتصال شبکه برای ${utilityElectrical.acPowerMW}MW فعال شد.`,
      recommendation: "قبل از خروجی نهایی، جریان فیدر MV، حاشیه ترانس، DC/AC و محدودیت تزریق بررسی شود.",
      technical: `MV=${utilityElectrical.mv?.voltageKV}kV; TR=${utilityElectrical.transformer?.count}x${utilityElectrical.transformer?.unitMVA}MVA; feeders=${utilityElectrical.mv?.feederCount}`
    });
    (utilityElectrical.checks || []).forEach((check) => {
      if (check.ok) return;
      add({
        code: `UTILITY_${String(check.key || "CHECK").toUpperCase().replace(/-/g, "_")}`,
        title: "هشدار/خطای برق نیروگاهی",
        severity: check.level === "error" ? "error" : "warning",
        category: "utility-electrical",
        message: check.message,
        recommendation: check.recommendation || "پارامترهای نیروگاهی را بازبینی کنید.",
        technical: check.technical || ""
      });
    });
    if (utilityElectrical.dcAcRatio > 1.4) {
      add({
        code: "UTILITY_CLIPPING_RISK",
        title: "ریسک Clipping در نسبت DC/AC",
        severity: utilityElectrical.dcAcRatio > 1.5 ? "error" : "warning",
        category: "utility-electrical",
        message: `نسبت DC/AC برابر ${utilityElectrical.dcAcRatio} است و ممکن است باعث محدودسازی توان خروجی شود.`,
        recommendation: "توان DC، ظرفیت AC یا استراتژی clipping فصلی را بازبینی کنید.",
        technical: `dcAcRatio=${utilityElectrical.dcAcRatio}`
      });
    }
  }



  if (enterpriseUtility.active) {
    add({
      code: "ENTERPRISE_UTILITY_LAYER_ACTIVE",
      title: "لایه مهندسی نیروگاهی Enterprise فعال است",
      severity: enterpriseUtility.status === "error" ? "error" : enterpriseUtility.status === "warning" ? "warning" : "info",
      category: "enterprise-utility",
      message: `امتیاز لایه Enterprise Utility برابر ${enterpriseUtility.score} از ۱۰۰ است و حفاظت، شبکه، ترکِر، زمین، SCADA و تولید پیشرفته کنترل شدند.`,
      recommendation: "خطاها و هشدارهای این لایه قبل از تأیید نهایی طراحی نیروگاهی اصلاح شوند.",
      technical: `status=${enterpriseUtility.status}; score=${enterpriseUtility.score}`,
      value: enterpriseUtility.score,
      target: ">= 82"
    });
    (enterpriseUtility.checks || []).forEach((check) => {
      if (check.ok) return;
      add({
        code: `ENTERPRISE_${String(check.key || "CHECK").toUpperCase().replace(/-/g, "_")}`,
        title: "کنترل پیشرفته نیروگاهی",
        severity: check.level === "error" ? "error" : "warning",
        category: "enterprise-utility",
        message: check.message,
        recommendation: check.recommendation || "پارامترهای مهندسی نیروگاهی را بازبینی کنید.",
        technical: check.technical || ""
      });
    });
  }

    if (panelPowerAnalysis.status === "error") {
    add({
      code: "PANEL_POWER_SECTION_ERROR",
      title: "بخش توان پنل خورشیدی نیازمند اصلاح است",
      severity: "error",
      category: "panel-power",
      message: panelPowerAnalysis.checks?.find((item) => item.level === "error" && !item.ok)?.message || "در توان، تعداد، آرایش رشته یا محدوده MPPT پنل‌ها خطای مهندسی وجود دارد.",
      recommendation: panelPowerAnalysis.recommendations?.[0] || "توان پنل، تعداد سری/موازی و سقف ولتاژ DC اینورتر را بازبینی کنید.",
      technical: `PanelPower score=${panelPowerScore}`,
      value: panelPowerScore,
      target: ">= 80"
    });
  } else if (panelPowerAnalysis.status === "warning") {
    add({
      code: "PANEL_POWER_SECTION_WARNING",
      title: "بخش توان پنل خورشیدی هشدار دارد",
      severity: "warning",
      category: "panel-power",
      message: panelPowerAnalysis.checks?.find((item) => item.level === "warning" && !item.ok)?.message || "بخش توان پنل از نظر حاشیه انرژی یا نسبت توان به ورودی PV نیازمند بازبینی است.",
      recommendation: panelPowerAnalysis.recommendations?.[0] || "حاشیه فصلی، تعداد پنل و محدودیت ورودی PV بررسی شود.",
      technical: `PanelPower score=${panelPowerScore}`,
      value: panelPowerScore,
      target: ">= 80"
    });
  } else if (panelPowerScore > 0) {
    add({
      code: "PANEL_POWER_SECTION_OK",
      title: "بخش توان پنل خورشیدی کامل و قابل قبول است",
      severity: "ok",
      category: "panel-power",
      message: `امتیاز بخش توان پنل ${round(panelPowerScore, 0)} از ۱۰۰ است و توان، تولید، آرایش رشته و MPPT کنترل شده‌اند.`,
      technical: "Panel power module completed with power, energy, MPPT, string and area checks.",
      value: panelPowerScore,
      target: ">= 80"
    });
  }

  if (totalPowerW <= 0 || totalEnergyWh <= 0) {
    add({
      code: "LOAD_INPUT_INCOMPLETE",
      title: "ورودی بار مصرفی ناقص است",
      severity: "critical",
      category: "load",
      message: "توان و انرژی روزانه بار باید قبل از اعتبارسنجی نهایی ثبت شود.",
      recommendation: "صفحه بار مصرفی را کامل کنید تا طراحی پنل، باتری و اینورتر قابل اتکا باشد.",
      technical: "totalPowerW یا totalEnergyWh مقدار معتبر ندارد."
    });
  } else {
    add({
      code: "LOAD_INPUT_OK",
      title: "ورودی بار مصرفی معتبر است",
      severity: "ok",
      category: "load",
      message: `توان همزمان ${round(totalPowerW, 0)} وات و انرژی روزانه ${round(totalEnergyWh / 1000, 2)} کیلووات‌ساعت مبنای محاسبه قرار گرفت.`,
      technical: "Load profile is available for sizing."
    });
  }

  if (coverageClass === "critical") {
    add({
      code: "PV_DAILY_ENERGY_CRITICAL",
      title: "کمبود جدی انرژی روزانه PV",
      severity: "critical",
      category: "pv-energy",
      message: `آرایه فعلی فقط حدود ${round(coveragePercent, 1)}٪ از مصرف روزانه را پوشش می‌دهد.`,
      recommendation: "تعداد پنل، ساعات آفتاب مؤثر یا تلفات محیطی را بازبینی کنید؛ ادامه طراحی بدون اصلاح باعث کمبود انرژی می‌شود.",
      technical: "E_pv_daily / E_load_daily < 50%",
      value: coveragePercent,
      target: ">= 100%"
    });
  } else if (coverageClass === "partial") {
    add({
      code: "PV_DAILY_ENERGY_LOW",
      title: "پوشش انرژی روزانه ناکافی است",
      severity: "error",
      category: "pv-energy",
      message: `آرایه فعلی حدود ${round(coveragePercent, 1)}٪ از مصرف روزانه را پوشش می‌دهد.`,
      recommendation: "برای پوشش کامل مصرف، تعداد پنل یا راندمان مؤثر سیستم باید افزایش یابد یا مصرف روزانه کاهش پیدا کند.",
      technical: "50% <= Coverage < 80%",
      value: coveragePercent,
      target: ">= 100%"
    });
  } else if (coverageClass === "near") {
    add({
      code: "PV_DAILY_ENERGY_MARGIN_LOW",
      title: "پوشش نزدیک به حداقل است",
      severity: "warning",
      category: "pv-energy",
      message: `پوشش روزانه ${round(coveragePercent, 1)}٪ است و حاشیه اطمینان کافی ندارد.`,
      recommendation: "برای افت زمستان، گردوغبار و خطای مصرف، حداقل ۱۰ تا ۲۰ درصد حاشیه طراحی در نظر بگیرید.",
      technical: "80% <= Coverage < 100%",
      value: coveragePercent,
      target: "100-120%"
    });
  } else if (coverageClass === "oversized") {
    add({
      code: "PV_DAILY_ENERGY_OVERSIZED",
      title: "آرایه از نظر انرژی روزانه بزرگ‌تر از نیاز است",
      severity: "warning",
      category: "pv-energy",
      message: `پوشش روزانه حدود ${round(coveragePercent, 1)}٪ است.`,
      recommendation: "از نظر مهندسی، ظرفیت اضافی فقط در صورت نیاز به توسعه آینده، افت فصلی یا شارژ سریع باتری توجیه دارد.",
      technical: "Coverage >= 120%",
      value: coveragePercent,
      target: "100-120%"
    });
  } else if (coverageClass === "complete") {
    add({
      code: "PV_DAILY_ENERGY_OK",
      title: "تولید روزانه با مصرف سازگار است",
      severity: "ok",
      category: "pv-energy",
      message: `پوشش روزانه ${round(coveragePercent, 1)}٪ است و از نظر انرژی روزانه قابل قبول است.`,
      technical: "100% <= Coverage < 120%",
      value: coveragePercent,
      target: "100-120%"
    });
  }

  if (requiredPvW > 0 && arrayPowerW < requiredPvW) {
    add({
      code: "PV_ARRAY_UNDERSIZED",
      title: "توان آرایه پنل کمتر از نیاز محاسباتی است",
      severity: "error",
      category: "pv-array",
      message: `توان آرایه ${round(arrayPowerW, 0)} وات و نیاز محاسباتی حدود ${round(requiredPvW, 0)} وات است.`,
      recommendation: "تعداد پنل یا توان هر پنل را افزایش دهید تا توان آرایه از نیاز محاسباتی عبور کند.",
      technical: "arrayPowerW < requiredPvW",
      value: arrayPowerW,
      target: requiredPvW
    });
  }

  if (psh < 3.5) {
    add({
      code: "LOW_PEAK_SUN_HOURS",
      title: "ساعات آفتاب مؤثر پایین است",
      severity: "warning",
      category: "environment",
      message: `PSH برابر ${round(psh, 1)} ساعت است؛ طراحی در چنین شرایطی حساس‌تر می‌شود.`,
      recommendation: "ضریب زمستان، سایه، جهت نصب و زاویه پنل را با دقت بیشتری وارد کنید.",
      technical: "PSH < 3.5h",
      value: psh,
      target: ">= 3.5h"
    });
  }

  if (effectiveEfficiency < 0.62) {
    add({
      code: "HIGH_SYSTEM_LOSS",
      title: "تلفات مؤثر سیستم بالاست",
      severity: "warning",
      category: "environment",
      message: `راندمان مؤثر سیستم حدود ${round(effectiveEfficiency * 100, 1)}٪ است.`,
      recommendation: "سایه‌اندازی، گردوغبار، دمای محیط، طول کابل و تهویه تجهیزات را بازبینی کنید.",
      technical: "effectiveEfficiency < 62%",
      value: round(effectiveEfficiency * 100, 1),
      target: ">= 62%"
    });
  }

  if (inverterRatedTotalW > 0) {
    const inverterLoadRatio = designPowerW / inverterRatedTotalW;
    if (inverterLoadRatio > 1) {
      add({
        code: "INVERTER_POWER_EXCEEDED",
        title: "توان دائم اینورتر کافی نیست",
        severity: "critical",
        category: "inverter",
        message: `توان طراحی ${round(designPowerW, 0)} وات از ظرفیت اینورتر ${round(inverterRatedTotalW, 0)} وات بیشتر است.`,
        recommendation: "توان اینورتر یا تعداد اینورتر موازی را افزایش دهید یا بار همزمان را کاهش دهید.",
        technical: "designPowerW > inverterRatedTotalW",
        value: round(inverterLoadRatio * 100, 1),
        target: "<= 85%"
      });
    } else if (inverterLoadRatio > 0.85) {
      add({
        code: "INVERTER_POWER_MARGIN_LOW",
        title: "حاشیه توان دائم اینورتر کم است",
        severity: "warning",
        category: "inverter",
        message: `نسبت بار به ظرفیت اینورتر حدود ${round(inverterLoadRatio * 100, 1)}٪ است.`,
        recommendation: "برای پایداری حرارتی و توسعه آینده، بهتر است بار دائم زیر ۸۵٪ ظرفیت نامی بماند.",
        technical: "inverter load ratio > 85%",
        value: round(inverterLoadRatio * 100, 1),
        target: "<= 85%"
      });
    } else {
      add({
        code: "INVERTER_POWER_OK",
        title: "توان دائم اینورتر قابل قبول است",
        severity: "ok",
        category: "inverter",
        message: `نسبت بار به ظرفیت اینورتر حدود ${round(inverterLoadRatio * 100, 1)}٪ است.`,
        technical: "inverter load ratio <= 85%"
      });
    }
  }

  if (inverterSurgeTotalW > 0 && designSurgeW > inverterSurgeTotalW) {
    add({
      code: "INVERTER_SURGE_EXCEEDED",
      title: "توان لحظه‌ای اینورتر کافی نیست",
      severity: "error",
      category: "inverter",
      message: `توان راه‌اندازی ${round(designSurgeW, 0)} وات از تحمل لحظه‌ای ${round(inverterSurgeTotalW, 0)} وات بیشتر است.`,
      recommendation: "بارهای موتوری، ضریب راه‌اندازی، سافت‌استارتر یا ظرفیت اینورتر را بازبینی کنید.",
      technical: "designSurgeW > inverterSurgeTotalW"
    });
  }

  if (maxPvPowerW > 0 && arrayPowerW > maxPvPowerW) {
    add({
      code: "PV_INPUT_POWER_EXCEEDED",
      title: "توان PV از سقف ورودی اینورتر بیشتر است",
      severity: "error",
      category: "mppt",
      message: `توان آرایه ${round(arrayPowerW, 0)} وات و سقف ورودی اینورتر ${round(maxPvPowerW, 0)} وات است.`,
      recommendation: "توان آرایه، تعداد MPPT، تعداد اینورتر یا مدل اینورتر باید بازبینی شود.",
      technical: "arrayPowerW > inverter.maxPvPowerW * inverterCount"
    });
  }

  const mpptMinV = num(inverter.mpptMinV, 0);
  const mpptMaxV = num(inverter.mpptMaxV, 0);
  const maxDcVoltage = num(inverter.maxDcVoltage, mpptMaxV);
  const hotStringVmp = num(pvArray.hotStringVmp, pvArray.stringVmp);
  const stringVmp = num(pvArray.stringVmp, 0);
  const coldStringVoc = num(pvArray.coldStringVoc, pvArray.stringVoc);

  if (mpptMinV && hotStringVmp < mpptMinV) {
    add({
      code: "MPPT_LOW_VOLTAGE_RISK",
      title: "ریسک افت ولتاژ رشته زیر حد MPPT",
      severity: "error",
      category: "mppt",
      message: `Vmp گرم رشته حدود ${round(hotStringVmp, 1)} ولت است و از حداقل MPPT کمتر است.`,
      recommendation: "تعداد پنل سری را افزایش دهید یا اینورتر با محدوده MPPT مناسب‌تر انتخاب کنید.",
      technical: "hotStringVmp < mpptMinV"
    });
  }

  if (mpptMaxV && stringVmp > mpptMaxV) {
    add({
      code: "MPPT_HIGH_OPERATING_VOLTAGE",
      title: "ولتاژ کاری رشته از محدوده MPPT بالاتر است",
      severity: "error",
      category: "mppt",
      message: `Vmp رشته حدود ${round(stringVmp, 1)} ولت است و از سقف MPPT عبور می‌کند.`,
      recommendation: "تعداد پنل سری را کاهش دهید یا آرایش سری/موازی را اصلاح کنید.",
      technical: "stringVmp > mpptMaxV"
    });
  }

  if (maxDcVoltage && coldStringVoc > maxDcVoltage) {
    add({
      code: "DC_VOLTAGE_LIMIT_EXCEEDED",
      title: "ولتاژ مدار باز سرد از سقف DC عبور می‌کند",
      severity: "critical",
      category: "mppt",
      message: `Voc سرد رشته حدود ${round(coldStringVoc, 1)} ولت و سقف مجاز ${round(maxDcVoltage, 1)} ولت است.`,
      recommendation: "تعداد پنل سری را فوراً کاهش دهید؛ این خطا می‌تواند به ورودی DC اینورتر آسیب بزند.",
      technical: "coldStringVoc > maxDcVoltage"
    });
  }

  if (requiredBatteryWh > 0) {
    const batteryCoverage = batteryUsableWh / requiredBatteryWh;
    if (batteryCoverage < 1) {
      add({
        code: "BATTERY_AUTONOMY_NOT_MET",
        title: "ظرفیت قابل استفاده باتری کافی نیست",
        severity: "error",
        category: "battery",
        message: `ظرفیت قابل استفاده ${round(batteryUsableWh / 1000, 2)} kWh و نیاز خودکفایی ${round(requiredBatteryWh / 1000, 2)} kWh است.`,
        recommendation: "تعداد موازی باتری، ظرفیت باتری یا روزهای خودکفایی را بازبینی کنید.",
        technical: "usableBatteryWh < requiredBatteryWh",
        value: round(batteryCoverage * 100, 1),
        target: ">= 100%"
      });
    } else if (batteryCoverage > 1.8) {
      add({
        code: "BATTERY_OVERSIZED",
        title: "بانک باتری بزرگ‌تر از نیاز خودکفایی است",
        severity: "warning",
        category: "battery",
        message: `ظرفیت قابل استفاده باتری حدود ${round(batteryCoverage * 100, 1)}٪ نیاز محاسباتی است.`,
        recommendation: "اگر توسعه آینده یا محدودیت دشارژ عمیق مدنظر نیست، ظرفیت باتری را مهندسی‌تر تنظیم کنید.",
        technical: "usableBatteryWh > 180% of requiredBatteryWh"
      });
    } else {
      add({
        code: "BATTERY_AUTONOMY_OK",
        title: "ظرفیت باتری برای خودکفایی قابل قبول است",
        severity: "ok",
        category: "battery",
        message: `بانک باتری حدود ${round(batteryCoverage * 100, 1)}٪ نیاز خودکفایی ${round(autonomyDays, 1)} روزه را پوشش می‌دهد.`,
        technical: "usableBatteryWh >= requiredBatteryWh"
      });
    }
  }

  const dod = num(battery.battery?.usableDod, solarSizing?.input?.DoD || 0);
  if (dod > 0.9) {
    add({
      code: "BATTERY_DOD_AGGRESSIVE",
      title: "عمق دشارژ انتخابی تهاجمی است",
      severity: "warning",
      category: "battery",
      message: `DoD مجاز ${round(dod * 100, 0)}٪ در نظر گرفته شده است.`,
      recommendation: "برای افزایش عمر عملیاتی، در طراحی‌های حساس حاشیه ظرفیت بیشتری لحاظ کنید.",
      technical: "DoD > 90%"
    });
  }

  if (batteryGrossWh > 0 && batteryUsableWh > 0 && batteryUsableWh / batteryGrossWh < 0.45) {
    add({
      code: "LOW_USABLE_BATTERY_RATIO",
      title: "نسبت ظرفیت قابل استفاده باتری پایین است",
      severity: "warning",
      category: "battery",
      message: "بخش زیادی از ظرفیت نامی باتری در طراحی قابل استفاده نیست.",
      recommendation: "نوع باتری، DoD و راندمان شارژ/دشارژ را بازبینی کنید.",
      technical: "usableBatteryWh / grossBatteryWh < 45%"
    });
  }

  if (num(protection.dcCurrentA, 0) > 160) {
    add({
      code: "HIGH_DC_CURRENT",
      title: "جریان DC بالا است",
      severity: "warning",
      category: "protection",
      message: `جریان DC حدود ${round(protection.dcCurrentA, 1)} آمپر است.`,
      recommendation: "مسیر کابل، باس‌بار، افت ولتاژ، حفاظت DC و تهویه تابلو باید دقیق‌تر کنترل شود.",
      technical: "DC current > 160A"
    });
  }

  if (Array.isArray(validation.checks)) {
    validation.checks.filter((check) => !check.ok).forEach((check) => {
      if (!items.some((item) => item.code === `VALIDATION_${String(check.key).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`)) {
        add({
          code: `VALIDATION_${String(check.key).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
          title: "خطای اعتبارسنجی مهندسی",
          severity: check.level === "error" ? "error" : "warning",
          category: "validation",
          message: check.message,
          recommendation: check.fix || "پارامتر مربوطه را بازبینی کنید.",
          technical: `validation:${check.key}`
        });
      }
    });
  }

  const actionable = items.filter((item) => ["critical", "error", "warning"].includes(item.severity));
  const critical = items.filter((item) => item.severity === "critical").length;
  const errors = items.filter((item) => item.severity === "error").length;
  const warnings = items.filter((item) => item.severity === "warning").length;
  const score = clamp(100 - items.reduce((sum, item) => sum + (SEVERITY_WEIGHT[item.severity] || 0), 0), 0, 100);
  const status = critical > 0 ? "blocked" : errors > 0 ? "needs-correction" : warnings > 0 ? "review" : "approved";
  const statusLabel = {
    blocked: "متوقف به دلیل خطای بحرانی",
    "needs-correction": "نیازمند اصلاح مهندسی",
    review: "قابل قبول با نیاز به بازبینی",
    approved: "تأیید مهندسی"
  }[status];

  const recommendations = actionable.map((item) => item.recommendation).filter(Boolean);
  const summary = [
    `امتیاز سلامت طراحی: ${round(score, 0)} از ۱۰۰`,
    critical ? `${critical} خطای بحرانی باید قبل از خروجی نهایی اصلاح شود.` : "خطای بحرانی ثبت نشد.",
    errors ? `${errors} خطای مهندسی نیازمند اصلاح وجود دارد.` : "خطای مهندسی الزام‌آور ثبت نشد.",
    warnings ? `${warnings} هشدار برای بازبینی طراحی وجود دارد.` : "هشدار مهمی برای بازبینی باقی نمانده است."
  ];

  return {
    version: "solar-professional-diagnostics-v1",
    score: round(score, 0),
    status,
    statusLabel,
    critical,
    errors,
    warnings,
    ok: items.filter((item) => item.severity === "ok").length,
    items,
    actionable,
    recommendations: [...new Set(recommendations)],
    summary,
    categories: items.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || { total: 0, critical: 0, errors: 0, warnings: 0, ok: 0 };
      acc[item.category].total += 1;
      if (item.severity === "critical") acc[item.category].critical += 1;
      if (item.severity === "error") acc[item.category].errors += 1;
      if (item.severity === "warning") acc[item.category].warnings += 1;
      if (item.severity === "ok") acc[item.category].ok += 1;
      return acc;
    }, {})
  };
}
