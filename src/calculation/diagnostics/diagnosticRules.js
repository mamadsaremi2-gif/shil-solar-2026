const n = (value, fallback = 0) => {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
};

const push = (items, severity, code, message, recommendation, category = "general", technical = "") => {
  items.push({ severity, code, message, recommendation, category, technical });
};

export function runDiagnostics(form = {}, result = {}) {
  const diagnostics = [];
  const outputs = result.outputs || {};
  const project = form.project || {};
  const dailyDemandWh = n(project.dailyEnergyWh, n(project.dailyEnergyKWh, 0) * 1000);
  const scenario = project.scenario || form.scenario || "offgrid";

  const pvDailyWh = n(outputs.pv?.estimatedDailyEnergyWh, n(outputs.sizing?.pvDailyWh, 0));
  if (dailyDemandWh > 0 && pvDailyWh > 0) {
    const coverage = (pvDailyWh / dailyDemandWh) * 100;
    if (coverage < 50) push(diagnostics, "critical", "ENERGY_DEFICIT_CRITICAL", "تولید روزانه PV کمتر از نصف مصرف روزانه است.", "توان آرایه، PSH یا تلفات محیطی را اصلاح کنید.", "pv-energy", `coverage=${coverage.toFixed(1)}%`);
    else if (coverage < 80) push(diagnostics, "error", "ENERGY_DEFICIT", "تولید روزانه PV برای مصرف ثبت‌شده کافی نیست.", "تعداد پنل یا راندمان مؤثر سیستم افزایش یابد یا مصرف کاهش پیدا کند.", "pv-energy", `coverage=${coverage.toFixed(1)}%`);
    else if (coverage < 100) push(diagnostics, "warning", "ENERGY_MARGIN_LOW", "تولید روزانه PV نزدیک به مرز کمبود است.", "برای افت زمستان و خطای مصرف حاشیه ۱۰ تا ۲۰ درصدی در نظر بگیرید.", "pv-energy", `coverage=${coverage.toFixed(1)}%`);
    else if (coverage > 130) push(diagnostics, "warning", "PV_OVERSIZED", "توان تولید روزانه PV به‌طور محسوسی بزرگ‌تر از مصرف است.", "ظرفیت اضافه فقط در صورت توسعه آینده یا افت فصلی توجیه فنی دارد.", "pv-energy", `coverage=${coverage.toFixed(1)}%`);
  }

  const inverter = outputs.inverter || {};
  const loadRatio = n(inverter.loadRatio, 0);
  if (loadRatio > 1) push(diagnostics, "critical", "INVERTER_OVERLOADED", "توان دائم مورد نیاز از توان اینورتر عبور کرده است.", "توان یا تعداد اینورتر را افزایش دهید یا بار همزمان را کاهش دهید.", "inverter");
  else if (loadRatio > 0.85) push(diagnostics, "warning", "INVERTER_HIGH_LOAD_RATIO", "حاشیه توان دائم اینورتر کم است.", "بار دائم بهتر است زیر ۸۵٪ ظرفیت نامی اینورتر بماند.", "inverter");

  const surgeRatio = n(inverter.surgeRatio, 0);
  if (surgeRatio > 1) push(diagnostics, "error", "INVERTER_SURGE_RISK", "توان لحظه‌ای راه‌اندازی از ظرفیت Surge اینورتر بیشتر است.", "بارهای موتوری، سافت‌استارتر یا ظرفیت اینورتر را بازبینی کنید.", "inverter");

  const battery = outputs.battery || {};
  const autonomyCoverageDays = n(battery.autonomyCoverageDays, 0);
  const requestedAutonomyDays = n(project.autonomyDays, 0);
  if (scenario !== "ongrid" && requestedAutonomyDays > 0) {
    if (autonomyCoverageDays < requestedAutonomyDays * 0.75) push(diagnostics, "critical", "AUTONOMY_CRITICAL", "خودکفایی باتری به‌طور جدی کمتر از نیاز پروژه است.", "ظرفیت باتری یا آرایش موازی افزایش یابد یا روزهای خودکفایی اصلاح شود.", "battery");
    else if (autonomyCoverageDays < requestedAutonomyDays) push(diagnostics, "error", "AUTONOMY_NOT_MET", "پوشش خودکفایی باتری کمتر از مقدار درخواستی است.", "ظرفیت قابل استفاده باتری را افزایش دهید یا مصرف روزانه را بازبینی کنید.", "battery");
    else if (autonomyCoverageDays > requestedAutonomyDays * 1.8) push(diagnostics, "warning", "BATTERY_OVERSIZED", "ظرفیت باتری نسبت به نیاز خودکفایی بزرگ است.", "در صورت نبود توسعه آینده، ظرفیت باتری را بهینه‌تر انتخاب کنید.", "battery");
  }

  const cable = outputs.cable || {};
  if (cable.withinLimit === false) push(diagnostics, "error", "CABLE_DROP_EXCEEDED", "افت ولتاژ کابل از حد طراحی عبور کرده است.", "سطح مقطع کابل را افزایش دهید یا طول مسیر کابل را کاهش دهید.", "cable");
  if (n(cable.voltageDropPercent, 0) > 5) push(diagnostics, "critical", "CABLE_DROP_CRITICAL", "افت ولتاژ کابل در محدوده بحرانی قرار دارد.", "مسیر کابل و سطح مقطع باید قبل از خروجی نهایی اصلاح شود.", "cable");

  const controller = outputs.controller || {};
  if (controller.mpptCompatible === false) push(diagnostics, "error", "MPPT_MISMATCH", "ولتاژ یا جریان آرایه با محدوده MPPT سازگار نیست.", "آرایش سری/موازی پنل یا ورودی MPPT را بازبینی کنید.", "mppt");
  if (controller.coldVocSafe === false) push(diagnostics, "critical", "COLD_VOC_UNSAFE", "Voc سرد رشته پنل از سقف ورودی DC عبور می‌کند.", "تعداد پنل سری را کاهش دهید؛ این خطا نباید در خروجی نهایی باقی بماند.", "mppt");

  const loss = outputs.loss || {};
  if (n(loss.totalLossPercent, 0) > 28) push(diagnostics, "warning", "HIGH_TOTAL_LOSS", "تلفات کل سیستم بالاست و خروجی واقعی را کاهش می‌دهد.", "سایه، گردوغبار، دما، کابل و راندمان تجهیزات را بازبینی کنید.", "loss");

  return diagnostics;
}
