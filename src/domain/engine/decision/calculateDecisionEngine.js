function round(value, digits = 2) { const f = 10 ** digits; return Math.round((Number(value) || 0) * f) / f; }
function rank(s) { return { error: 4, warning: 3, info: 2, pass: 1 }[s] || 0; }
function add(items, severity, title, message, recommendation, category = 'system') { items.push({ severity, title, message, recommendation, category }); }
function oversizeThresholds(input) {
  if (input.systemType === 'gridtie') return { info: 1.2, severe: 1.6 };
  if (input.systemType === 'hybrid') return { info: 1.5, severe: 2.2 };
  if (input.systemType === 'backup') return { info: 1.4, severe: 2.0 };
  return { info: 2.5, severe: 3.0 };
}
export function calculateDecisionEngine(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation, validation) {
  const decisions = [];
  const netPvWh = installation?.losses?.netDailyProductionWh ?? pv?.estimatedDailyProductionWh ?? 0;
  const dailyLoadWh = loads.totalDailyEnergyWh || 0;
  const netCoverageRatio = pv && dailyLoadWh > 0 ? netPvWh / dailyLoadWh : 0;
  const dcAcRatio = pv?.dcAcRatio || 0;
  const inverterUtil = loads.demandPowerW / Math.max(inverter?.continuousPowerW || 1, 1);
  if (pv) {
    if (netCoverageRatio < 0.9 && input.systemType !== 'gridtie') add(decisions, 'error', 'PV کم‌طراحی شده است', `تولید خالص روزانه حدود ${round(netPvWh)}Wh است و فقط ${round(netCoverageRatio * 100, 0)}٪ مصرف روزانه را پوشش می‌دهد.`, 'توان پنل یا شرایط نصب را اصلاح کن.', 'pv');
    else {
      const thresholds = oversizeThresholds(input);
      if (netCoverageRatio > thresholds.severe && dailyLoadWh > 0) add(decisions, 'warning', 'PV بیش‌طراحی شده است', `تولید خالص حدود ${round(netCoverageRatio, 1)} برابر مصرف روزانه است.`, 'برای این نوع سیستم هدف اضافه‌ظرفیت را مشخص کن: شارژ سریع باتری، توسعه آینده، یا کاهش تعداد پنل.', 'pv');
      else if (netCoverageRatio > thresholds.info && input.systemType !== 'gridtie') add(decisions, 'info', 'PV بزرگ‌تر از مصرف روزانه است', `تولید خالص حدود ${round(netCoverageRatio, 1)} برابر مصرف روزانه است.`, 'در آفگرید این موضوع می‌تواند برای شارژ مجدد باتری و روزهای ضعیف قابل قبول باشد.', 'pv');
    }
    const maxRatio = pv.mpptSpecs?.maxDcAcRatio || 1.4;
    if (dcAcRatio > maxRatio * 2.0) add(decisions, 'error', 'نسبت DC/AC غیرمجاز است', `نسبت DC/AC برابر ${round(dcAcRatio, 2)} است.`, 'توان PV را کم کن یا اینورتر با توان/ورودی PV بالاتر انتخاب کن.', 'pv');
    else if (dcAcRatio > maxRatio) add(decisions, 'warning', 'نسبت DC/AC مرزی است', `نسبت DC/AC برابر ${round(dcAcRatio, 2)} است و ممکن است clipping ایجاد کند.`, 'دیتاشیت اینورتر و سیاست oversizing سازنده کنترل شود.', 'pv');
    if (pv.mpptDesign?.status === 'error') add(decisions, 'error', 'آرایش PV با MPPT سازگار نیست', 'یکی از کنترل‌های حیاتی Voc، جریان یا توان مجاز PV رد شده است.', 'آرایش سری/موازی، تعداد MPPT یا مدل اینورتر را اصلاح کن.', 'mppt');
    else if (pv.mpptDesign?.status === 'warning') add(decisions, 'warning', 'آرایش PV مرزی است', 'آرایش فعلی از نظر MPPT نزدیک محدودیت دیتاشیت است.', 'حاشیه ولتاژ و جریان را با دیتاشیت واقعی کنترل کن.', 'mppt');
  }
  if (input.systemType !== 'gridtie') {
    if ((industrial?.backupCoverageRatio ?? 1) < 0.95) add(decisions, 'error', 'باتری برای هدف پشتیبانی کافی نیست', `پوشش هدف باتری حدود ${round((industrial.backupCoverageRatio || 0) * 100, 0)}٪ است.`, 'ظرفیت موازی باتری، DoD مجاز یا هدف پشتیبانی را اصلاح کن.', 'battery');
    if (battery?.dischargeCRate > battery?.recommendedDischargeC) add(decisions, battery.dischargeCRate > battery.recommendedDischargeC * 1.25 ? 'error' : 'warning', 'نرخ دشارژ باتری بالاست', `نرخ دشارژ ${round(battery.dischargeCRate, 2)}C است.`, 'بانک باتری بزرگ‌تر یا باتری با BMS و جریان دشارژ بالاتر انتخاب کن.', 'battery');
  }
  if (inverterUtil > 0.9) add(decisions, 'warning', 'اینورتر نزدیک ظرفیت دائم کار می‌کند', `بار دیماند حدود ${round(inverterUtil * 100, 0)}٪ ظرفیت اینورتر است.`, 'برای گرمای محیط و عمر بهتر، یک پله بالاتر انتخاب شود.', 'inverter');
  else if (inverterUtil < 0.35 && loads.demandPowerW > 0) add(decisions, 'info', 'اینورتر نسبتاً بزرگ انتخاب شده است', `بار دیماند فقط ${round(inverterUtil * 100, 0)}٪ ظرفیت اینورتر است.`, 'اگر هدف توسعه آینده نیست، اینورتر کوچک‌تر اقتصادی‌تر است.', 'inverter');
  for (const circuit of [cabling?.dc, cabling?.battery, cabling?.ac].filter(Boolean)) {
    const limit = circuit.circuitName === 'PV DC' ? input.dcVoltageDropLimit : circuit.circuitName === 'Battery DC' ? input.batteryVoltageDropLimit : input.acVoltageDropLimit;
    if (circuit.voltageDropPercent > limit) add(decisions, 'error', `افت ولتاژ ${circuit.circuitName} زیاد است`, `افت ${round(circuit.voltageDropPercent, 2)}٪ است.`, 'سطح مقطع را افزایش بده یا مسیر کابل را کوتاه کن.', 'cable');
  }
  if (installation?.area?.status === 'error') add(decisions, 'error', 'فضای نصب کافی نیست', 'مساحت مفید محل نصب از نیاز اجرایی آرایه کمتر است.', 'تعداد پنل، جانمایی یا محل نصب را تغییر بده.', 'installation');
  if (installation?.losses?.totalInstallationLossPercent > 22) add(decisions, 'warning', 'تلفات نصب زیاد است', `تلفات نصب/محیطی ${round(installation.losses.totalInstallationLossPercent, 1)}٪ است.`, 'سایه، جهت، زاویه، گردوغبار و کابل را اصلاح کن.', 'installation');
  const hardErrors = decisions.filter(d => d.severity === 'error').length + (validation?.summary?.counts?.error || 0);
  const warnings = decisions.filter(d => d.severity === 'warning').length + (validation?.summary?.counts?.warning || 0);
  const overallStatus = hardErrors > 0 ? 'not_executable' : warnings > 0 ? 'executable_with_warnings' : 'executable';
  const thresholds = oversizeThresholds(input);
  const energySizing = !pv ? 'not_applicable' : netCoverageRatio < 0.9 ? 'undersized' : netCoverageRatio > thresholds.severe ? 'severely_oversized' : netCoverageRatio > thresholds.info ? 'oversized' : 'balanced';
  const economicStatus = energySizing === 'severely_oversized' || inverterUtil < 0.35 ? 'needs_economic_review' : energySizing === 'oversized' ? 'oversized_but_possible' : 'reasonable';
  if (!decisions.length) add(decisions, 'pass', 'طراحی در کنترل تصمیم‌گیری قبول شد', 'کنترل‌های اصلی سایزینگ، MPPT، کابل، باتری و نصب خطای جدی نشان ندادند.', 'قبل از اجرا دیتاشیت، بازدید محل و استاندارد نصب کنترل شود.', 'system');
  return { overallStatus, economicStatus, energySizing, netCoverageRatio: round(netCoverageRatio, 2), dcAcRatio: round(dcAcRatio, 2), inverterUtilizationPercent: round(inverterUtil * 100, 0), hardErrors, warnings, decisions: decisions.sort((a,b)=>rank(b.severity)-rank(a.severity)) };
}
