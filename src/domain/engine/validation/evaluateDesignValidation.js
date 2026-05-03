function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function makeCheck({ id, category, severity = 'info', status = 'pass', title, message, metric, limit, recommendation, scoreImpact = 0 }) {
  return { id, category, severity, status, title, message, metric, limit, recommendation, scoreImpact };
}

function pushCheck(checks, check) {
  checks.push(makeCheck(check));
}

function severityRank(severity) {
  return severity === 'error' ? 3 : severity === 'warning' ? 2 : severity === 'info' ? 1 : 0;
}

function summarize(checks) {
  const counts = checks.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { error: 0, warning: 0, info: 0, pass: 0 });
  const worst = checks.reduce((acc, item) => severityRank(item.severity) > severityRank(acc) ? item.severity : acc, 'pass');
  const score = Math.max(0, Math.min(100, Math.round(100 - checks.reduce((sum, item) => sum + (Number(item.scoreImpact) || 0), 0))));
  const grade = counts.error > 0 || score < 60 ? 'risky' : counts.warning > 0 || score < 82 ? 'acceptable' : 'excellent';
  return {
    status: worst === 'error' ? 'error' : worst === 'warning' ? 'warning' : 'success',
    grade,
    score,
    counts,
    label: grade === 'excellent' ? 'Excellent / طراحی مطمئن' : grade === 'acceptable' ? 'Acceptable / قابل قبول با هشدار' : 'Risky / نیازمند اصلاح',
  };
}

export function evaluateDesignValidation(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial) {
  const checks = [];
  const isBatteryBased = input.systemType !== 'gridtie';
  const hasPv = Boolean(pv);

  if (isBatteryBased) {
    const requiredHours = Number(industrial?.requiredBackupHours || 0);
    const realHours = Number(industrial?.realBackupHours || 0);
    const coverage = requiredHours > 0 ? realHours / requiredHours : 1;
    if (coverage < 0.98) {
      pushCheck(checks, { id: 'battery-backup-coverage', category: 'battery', severity: 'error', status: 'fail', title: 'ظرفیت باتری برای هدف پشتیبانی کافی نیست', message: `پوشش واقعی پشتیبانی ${round(coverage * 100, 0)}٪ است؛ هدف ${round(requiredHours, 1)} ساعت و مقدار واقعی ${round(realHours, 1)} ساعت محاسبه شد.`, metric: `${round(coverage * 100, 0)}٪`, limit: 'حداقل 98٪', recommendation: `ظرفیت بانک باتری را افزایش بده. ظرفیت اضافه تقریبی: ${round(industrial?.requiredExtraBatteryAh || 0, 0)}Ah یا حدود ${industrial?.suggestedExtraBatteryUnits || 0} باتری اضافه.`, scoreImpact: 28 });
    } else if (coverage < 1.1) {
      pushCheck(checks, { id: 'battery-backup-margin', category: 'battery', severity: 'warning', status: 'borderline', title: 'حاشیه اطمینان باتری کم است', message: `پوشش پشتیبانی ${round(coverage * 100, 0)}٪ است. طراحی کار می‌کند ولی حاشیه برای افت ظرفیت، دمای محیط و پیری باتری کم است.`, metric: `${round(coverage * 100, 0)}٪`, limit: 'پیشنهادی بالای 110٪', recommendation: 'یک رشته موازی باتری اضافه یا زمان پشتیبانی هدف را واقع‌بینانه‌تر کن.', scoreImpact: 8 });
    }

    if (battery?.dischargeCRate > battery?.recommendedDischargeC * 1.15) {
      pushCheck(checks, { id: 'battery-discharge-c-rate', category: 'battery', severity: 'error', status: 'fail', title: 'نرخ دشارژ باتری خطرناک است', message: `نرخ دشارژ ${round(battery.dischargeCRate, 2)}C است؛ حد پیشنهادی برای ${battery.chemistry} حدود ${battery.recommendedDischargeC}C است.`, metric: `${round(battery.dischargeCRate, 2)}C`, limit: `${battery.recommendedDischargeC}C`, recommendation: 'ظرفیت موازی باتری را افزایش بده، ولتاژ DC را بالاتر ببر یا بارهای پیک را مرحله‌ای راه‌اندازی کن.', scoreImpact: 22 });
    } else if (battery?.dischargeCRate > battery?.recommendedDischargeC * 0.85) {
      pushCheck(checks, { id: 'battery-discharge-c-rate-borderline', category: 'battery', severity: 'warning', status: 'borderline', title: 'نرخ دشارژ باتری نزدیک حد مجاز است', message: `نرخ دشارژ ${round(battery.dischargeCRate, 2)}C است و به محدوده کاری سنگین نزدیک شده است.`, metric: `${round(battery.dischargeCRate, 2)}C`, limit: `${battery.recommendedDischargeC}C`, recommendation: 'برای عمر بهتر باتری، بانک را کمی بزرگ‌تر انتخاب کن.', scoreImpact: 7 });
    }

    if (hasPv && battery?.chargeCRate > battery?.recommendedChargeC * 1.15) {
      pushCheck(checks, { id: 'battery-charge-c-rate', category: 'battery', severity: 'warning', status: 'borderline', title: 'جریان شارژ نسبت به ظرفیت باتری زیاد است', message: `نرخ شارژ تقریبی ${round(battery.chargeCRate, 2)}C است.`, metric: `${round(battery.chargeCRate, 2)}C`, limit: `${battery.recommendedChargeC}C`, recommendation: 'محدودیت شارژ BMS/باتری را کنترل کن یا ظرفیت باتری را افزایش بده.', scoreImpact: 7 });
    }
  }

  if (hasPv) {
    const pvTarget = input.systemType === 'gridtie' ? (input.targetOffsetPercent || 100) / 100 : 1;
    const actualCoverage = loads.totalDailyEnergyWh > 0 ? pv.estimatedDailyProductionWh / loads.totalDailyEnergyWh : 1;
    if (actualCoverage < pvTarget * 0.95) {
      pushCheck(checks, { id: 'pv-energy-shortage', category: 'pv', severity: input.systemType === 'offgrid' ? 'error' : 'warning', status: 'fail', title: 'توان آرایه PV برای انرژی هدف کافی نیست', message: `پوشش انرژی PV حدود ${round(actualCoverage * 100, 0)}٪ است؛ هدف طراحی حدود ${round(pvTarget * 100, 0)}٪ است.`, metric: `${round(actualCoverage * 100, 0)}٪`, limit: `${round(pvTarget * 100, 0)}٪`, recommendation: 'تعداد پنل‌ها را افزایش بده یا فرضیات مصرف/تابش را بازبینی کن.', scoreImpact: input.systemType === 'offgrid' ? 20 : 10 });
    }

    if (input.systemType === 'offgrid' && industrial?.pvWorstMonthCoverageRatio < 0.85) {
      pushCheck(checks, { id: 'pv-worst-month', category: 'pv', severity: 'warning', status: 'borderline', title: 'پوشش خورشیدی در بدترین ماه ضعیف است', message: `پوشش بدترین ماه حدود ${round((industrial.pvWorstMonthCoverageRatio || 0) * 100, 0)}٪ است.`, metric: `${round((industrial.pvWorstMonthCoverageRatio || 0) * 100, 0)}٪`, limit: 'حداقل پیشنهادی 85٪', recommendation: `برای طراحی زمستانی حدود ${industrial?.worstMonthExtraPanels || 0} پنل اضافه یا ژنراتور/شبکه کمکی در نظر بگیر.`, scoreImpact: 9 });
    }

    if (!pv.vocOk || pv.stringVocCold >= input.controllerMaxVoc * 0.95) {
      pushCheck(checks, { id: 'pv-cold-voc', category: 'pv', severity: pv.stringVocCold >= input.controllerMaxVoc ? 'error' : 'warning', status: pv.stringVocCold >= input.controllerMaxVoc ? 'fail' : 'borderline', title: 'ریسک ولتاژ Voc در هوای سرد', message: `Voc سرد رشته ${round(pv.stringVocCold, 0)}V و حد کنترلر ${input.controllerMaxVoc}V است.`, metric: `${round(pv.stringVocCold, 0)}V`, limit: `${input.controllerMaxVoc}V`, recommendation: 'تعداد پنل سری را کم کن یا کنترلر/اینورتر MPPT با ولتاژ ورودی بالاتر انتخاب کن.', scoreImpact: pv.stringVocCold >= input.controllerMaxVoc ? 30 : 10 });
    }

    if (!pv.mpptWindowOk) {
      pushCheck(checks, { id: 'pv-mppt-window', category: 'pv', severity: 'warning', status: 'borderline', title: 'ولتاژ کاری رشته خارج از پنجره بهینه MPPT است', message: `Vmp رشته ${round(pv.stringVmp, 0)}V و پنجره MPPT ${input.mpptMinVoltage} تا ${input.mpptMaxVoltage}V است.`, metric: `${round(pv.stringVmp, 0)}V`, limit: `${input.mpptMinVoltage}-${input.mpptMaxVoltage}V`, recommendation: 'آرایش سری/موازی پنل یا مدل کنترلر را اصلاح کن.', scoreImpact: 8 });
    }

    if (controller && controller.requiredCurrentA > controller.selectedCurrentA * controller.controllerCount * 0.98) {
      pushCheck(checks, { id: 'controller-current', category: 'controller', severity: 'warning', status: 'borderline', title: 'جریان کنترلر نزدیک ظرفیت انتخابی است', message: `جریان موردنیاز ${round(controller.requiredCurrentA, 1)}A و ظرفیت انتخابی کل حدود ${round(controller.selectedCurrentA * controller.controllerCount, 1)}A است.`, metric: `${round(controller.requiredCurrentA, 1)}A`, limit: `${round(controller.selectedCurrentA * controller.controllerCount, 1)}A`, recommendation: 'برای گرمای محیط و توسعه آینده، کنترلر بزرگ‌تر یا کنترلر موازی اضافه انتخاب کن.', scoreImpact: 6 });
    }
  }

  if (inverter) {
    const continuousUtil = loads.demandPowerW / Math.max(inverter.continuousPowerW, 1);
    const surgeUtil = loads.surgePowerW / Math.max(inverter.surgePowerW, 1);
    if (continuousUtil > 0.92) {
      pushCheck(checks, { id: 'inverter-continuous-utilization', category: 'inverter', severity: 'warning', status: 'borderline', title: 'اینورتر در محدوده بار سنگین کار می‌کند', message: `استفاده دائم از ظرفیت اینورتر حدود ${round(continuousUtil * 100, 0)}٪ است.`, metric: `${round(continuousUtil * 100, 0)}٪`, limit: 'پیشنهادی زیر 85٪', recommendation: `پله بعدی اینورتر حدود ${industrial?.inverterNextStepW || inverter.continuousPowerW}W را بررسی کن.`, scoreImpact: 8 });
    }
    if (surgeUtil > 1.0) {
      pushCheck(checks, { id: 'inverter-surge-utilization', category: 'inverter', severity: 'error', status: 'fail', title: 'Surge اینورتر برای راه‌اندازی بار کافی نیست', message: `نیاز Surge حدود ${round(loads.surgePowerW, 0)}W و ظرفیت Surge اینورتر ${round(inverter.surgePowerW, 0)}W است.`, metric: `${round(surgeUtil * 100, 0)}٪`, limit: 'زیر 95٪', recommendation: 'اینورتر با Surge بالاتر انتخاب کن یا راه‌اندازی موتور/کمپرسور را مرحله‌ای کن.', scoreImpact: 24 });
    } else if (surgeUtil > 0.9) {
      pushCheck(checks, { id: 'inverter-surge-margin', category: 'inverter', severity: 'warning', status: 'borderline', title: 'حاشیه Surge اینورتر کم است', message: `استفاده از ظرفیت Surge حدود ${round(surgeUtil * 100, 0)}٪ است.`, metric: `${round(surgeUtil * 100, 0)}٪`, limit: 'پیشنهادی زیر 85٪', recommendation: 'برای بارهای موتوری، یک پله اینورتر بزرگ‌تر یا سافت‌استارتر بررسی شود.', scoreImpact: 7 });
    }
  }

  if (cabling) {
    const cableRules = [
      ['dc-cable-drop', hasPv, cabling.dcVoltageDropPercent, input.dcVoltageDropLimit, 'افت ولتاژ کابل DC پنل زیاد است', 'dc'],
      ['battery-cable-drop', isBatteryBased, cabling.batteryVoltageDropPercent, input.batteryVoltageDropLimit, 'افت ولتاژ کابل باتری زیاد است', 'battery'],
      ['ac-cable-drop', true, cabling.acVoltageDropPercent, input.acVoltageDropLimit, 'افت ولتاژ کابل AC زیاد است', 'ac'],
    ];
    for (const [id, enabled, actual, limit, title, category] of cableRules) {
      if (!enabled) continue;
      if (Number(actual) > Number(limit)) {
        pushCheck(checks, { id, category: 'cabling', severity: 'error', status: 'fail', title, message: `افت ولتاژ ${round(actual, 2)}٪ است و از حد ${round(limit, 2)}٪ بیشتر شده است.`, metric: `${round(actual, 2)}٪`, limit: `${round(limit, 2)}٪`, recommendation: `سطح مقطع کابل ${category === 'battery' ? 'باتری' : category === 'dc' ? 'DC پنل' : 'AC'} را افزایش بده یا طول مسیر را کم کن.`, scoreImpact: 12 });
      } else if (Number(actual) > Number(limit) * 0.85) {
        pushCheck(checks, { id: `${id}-borderline`, category: 'cabling', severity: 'warning', status: 'borderline', title: `${title} - نزدیک حد`, message: `افت ولتاژ ${round(actual, 2)}٪ است و به حد مجاز ${round(limit, 2)}٪ نزدیک است.`, metric: `${round(actual, 2)}٪`, limit: `${round(limit, 2)}٪`, recommendation: 'در اجرای واقعی با دمای کابل، روش نصب و طول دقیق مسیر کنترل مجدد انجام شود.', scoreImpact: 4 });
      }
    }
  }

  if (isBatteryBased && protection?.batteryFuseA > 400) {
    pushCheck(checks, { id: 'battery-fuse-large', category: 'protection', severity: 'warning', status: 'borderline', title: 'فیوز باتری غیرمعمولاً بزرگ است', message: `فیوز باتری ${protection.batteryFuseA}A انتخاب شده است.`, metric: `${protection.batteryFuseA}A`, limit: 'پیشنهادی زیر 400A در یک شاخه', recommendation: 'مسیر DC را شاخه‌بندی کن، از باس‌بار مناسب استفاده کن یا ولتاژ سیستم را افزایش بده.', scoreImpact: 6 });
  }

  if (simulation?.summary?.unservedLoadWh > 0) {
    pushCheck(checks, { id: 'simulation-unserved-load', category: 'simulation', severity: 'warning', status: 'borderline', title: 'در شبیه‌سازی انرژی تأمین‌نشده دیده شد', message: `انرژی تأمین‌نشده ${round(simulation.summary.unservedLoadWh, 0)}Wh است.`, metric: `${round(simulation.summary.unservedLoadWh, 0)}Wh`, limit: '0Wh', recommendation: 'ظرفیت باتری، توان PV یا منبع کمکی را افزایش بده.', scoreImpact: 8 });
  }

  if (!checks.length) {
    pushCheck(checks, { id: 'design-validation-pass', category: 'system', severity: 'info', status: 'pass', title: 'طراحی در کنترل‌های اصلی مهندسی قبول شد', message: 'باتری، PV، اینورتر، کنترلر، کابل و حفاظت در محدوده‌های اصلی کنترل خودکار قرار دارند.', metric: 'OK', limit: 'Engineering rules', recommendation: 'قبل از اجرا، بازدید محل، دیتاشیت تجهیزات و استاندارد نصب کنترل شود.', scoreImpact: 0 });
  }

  return { summary: summarize(checks), checks: checks.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)) };
}
