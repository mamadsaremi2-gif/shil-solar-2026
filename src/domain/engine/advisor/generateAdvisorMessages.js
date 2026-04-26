function pushMessage(list, severity, title, message, relatedStep = "review") {
  list.push({ severity, title, message, relatedStep });
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function nextCableSize(size) {
  const sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];
  return sizes.find((item) => item > size) ?? Math.ceil(size / 50) * 50;
}

function uniqueMessages(messages) {
  const seen = new Set();
  return messages.filter((item) => {
    const key = `${item.severity}|${item.title}|${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addEngineeringGateChecks(messages, input, loadResult, batteryResult, pvResult, inverterResult, controllerResult, cablingResult, protectionResult, simulationResult, industrialResult) {
  const systemIsBatteryBased = input.systemType !== "gridtie";
  const hasPv = input.systemType !== "backup" && input.systemType !== "gridtie" && pvResult;

  if (systemIsBatteryBased) {
    const requiredHours = industrialResult?.requiredBackupHours || 0;
    const realHours = industrialResult?.realBackupHours || 0;
    const missingHours = Math.max(requiredHours - realHours, 0);
    if (requiredHours > 0 && missingHours > 0.05) {
      const extraAh = Math.max((industrialResult?.batteryRequiredForDesiredHoursAh || batteryResult.requiredBatteryAh) - batteryResult.bankNominalAh, 0);
      const extraParallel = Math.ceil(extraAh / Math.max(input.batteryUnitAh, 1));
      const extraBatteries = extraParallel * Math.max(batteryResult.seriesCount, 1);
      pushMessage(
        messages,
        "error",
        "کنترل مهندسی باتری: ظرفیت ناکافی",
        `هدف پشتیبانی ${round(requiredHours)} ساعت است اما طراحی فعلی حدود ${round(realHours)} ساعت تامین می‌کند. برای رسیدن به هدف، حدود ${round(extraAh, 0)}Ah ظرفیت موازی بیشتر لازم است${extraBatteries > 0 ? `؛ یعنی تقریباً ${extraBatteries} باتری ${input.batteryUnitVoltage}V ${input.batteryUnitAh}Ah اضافه.` : "."}`,
        "system"
      );
    }

    if (batteryResult.dischargeCRate > batteryResult.recommendedDischargeC * 1.25) {
      pushMessage(
        messages,
        "error",
        "کنترل مهندسی باتری: دشارژ بحرانی",
        `نرخ دشارژ ${round(batteryResult.dischargeCRate, 2)}C است و برای ${batteryResult.chemistry} از حد پیشنهادی ${batteryResult.recommendedDischargeC}C بالاتر است. بانک باتری باید بزرگ‌تر شود یا بار پیک تقسیم گردد.`,
        "system"
      );
    } else if (batteryResult.dischargeCRate > batteryResult.recommendedDischargeC) {
      pushMessage(messages, "warning", "کنترل مهندسی باتری: دشارژ مرزی", `نرخ دشارژ ${round(batteryResult.dischargeCRate, 2)}C است؛ برای افزایش عمر باتری بهتر است ظرفیت موازی بیشتر شود.`, "system");
    }

    if (hasPv && batteryResult.chargeCRate > batteryResult.recommendedChargeC * 1.25) {
      pushMessage(messages, "warning", "کنترل مهندسی باتری: شارژ سریع", `نرخ شارژ تقریبی ${round(batteryResult.chargeCRate, 2)}C است. اگر BMS یا باتری این جریان را پشتیبانی نکند، باید کنترلرها محدود یا ظرفیت باتری افزایش یابد.`, "system");
    }
  }

  if (hasPv) {
    if (!pvResult.vocOk || !controllerResult?.vocOk) {
      const safeSeries = Math.max(1, Math.floor((input.controllerMaxVoc * 0.9) / Math.max((pvResult.stringVocCold / Math.max(pvResult.panelSeriesCount, 1)), 1)));
      pushMessage(
        messages,
        "error",
        "کنترل مهندسی PV: Voc سرد خطرناک",
        `Voc سرد رشته ${round(pvResult.stringVocCold, 0)}V است و نباید به حد کنترلر ${input.controllerMaxVoc}V نزدیک یا بیشتر شود. تعداد سری پیشنهادی را حداکثر حدود ${safeSeries} پنل در هر رشته در نظر بگیر یا کنترلر با ولتاژ بالاتر انتخاب کن.`,
        "system"
      );
    }

    if (!pvResult.mpptWindowOk || !controllerResult?.mpptWindowOk) {
      const minSeries = Math.ceil(input.mpptMinVoltage / Math.max(input.panelVmp, 1));
      const maxSeries = Math.floor(input.mpptMaxVoltage / Math.max(input.panelVmp, 1));
      pushMessage(messages, "warning", "کنترل مهندسی MPPT: ولتاژ کاری نامناسب", `Vmp رشته ${round(pvResult.stringVmp, 0)}V است؛ بازه مطلوب با این پنل تقریباً ${minSeries} تا ${maxSeries} پنل سری است.`, "system");
    }

    if (industrialResult?.pvWorstMonthCoverageRatio < 1 && input.systemType === "offgrid") {
      const worstFactor = pvResult.estimatedDailyProductionWh > 0 ? (pvResult.worstMonthDailyProductionWh / pvResult.estimatedDailyProductionWh) : 0.7;
      const productionPerPanelWorstWh = input.panelWatt * Math.max(input.sunHours, 1) * Math.max(pvResult.performanceRatio, 0.1) * worstFactor;
      const extraPanels = Math.ceil((industrialResult.pvWorstMonthShortageWh || 0) / Math.max(productionPerPanelWorstWh, 1));
      if (extraPanels > 0) {
        pushMessage(messages, "warning", "کنترل بدترین ماه: پنل ناکافی", `در ماه ضعیف سال حدود ${round(industrialResult.pvWorstMonthShortageWh, 0)}Wh/day کمبود دیده می‌شود. برای طراحی زمستانی، حدود ${extraPanels} پنل ${input.panelWatt}W اضافه یا کاهش مصرف لازم است.`, "site");
      }
    }

    if (controllerResult?.controllerCount > 4) {
      pushMessage(messages, "warning", "کنترل مهندسی MPPT: تعداد کنترلر زیاد", `برای این طراحی ${controllerResult.controllerCount} کنترلر ${controllerResult.perControllerA}A پیشنهاد شده است. بهتر است ولتاژ باتری/باس DC بالاتر یا اینورترهای چندگانه بررسی شود.`, "system");
    }
  }

  if (inverterResult) {
    if (industrialResult?.inverterUtilizationPercent > 95) {
      pushMessage(messages, "error", "کنترل مهندسی اینورتر: اضافه‌بار دائم", `استفاده از ظرفیت اینورتر حدود ${industrialResult.inverterUtilizationPercent}% است. حداقل یک پله بالاتر، حدود ${industrialResult.inverterNextStepW}W، پیشنهاد می‌شود.`, "system");
    } else if (industrialResult?.inverterUtilizationPercent > 80) {
      pushMessage(messages, "warning", "کنترل مهندسی اینورتر: ظرفیت مرزی", `اینورتر با حدود ${industrialResult.inverterUtilizationPercent}% ظرفیت کار می‌کند؛ برای کارکرد طولانی و دمای بالا، حاشیه بیشتر توصیه می‌شود.`, "system");
    }

    if (industrialResult?.surgeUtilizationPercent > 100) {
      pushMessage(messages, "error", "کنترل Surge: پیک راه‌اندازی پوشش داده نمی‌شود", `پیک راه‌اندازی به حدود ${industrialResult.surgeUtilizationPercent}% توان Surge می‌رسد. اینورتر بزرگ‌تر یا مدیریت راه‌اندازی موتورها لازم است.`, "loads");
    } else if (industrialResult?.surgeUtilizationPercent > 85) {
      pushMessage(messages, "warning", "کنترل Surge: حاشیه کم", `پیک راه‌اندازی حدود ${industrialResult.surgeUtilizationPercent}% ظرفیت Surge است. برای موتور/کولر/پمپ، حاشیه بیشتری در نظر بگیر.`, "loads");
    }
  }

  if (cablingResult) {
    if (systemIsBatteryBased && cablingResult.batteryVoltageDropPercent > input.batteryVoltageDropLimit) {
      pushMessage(messages, "warning", "کنترل کابل باتری: افت ولتاژ بالا", `افت ولتاژ کابل باتری ${round(cablingResult.batteryVoltageDropPercent, 2)}٪ است. سایز بعدی پیشنهادی: حدود ${nextCableSize(cablingResult.batteryCableSizeMm2)}mm² یا کاهش طول کابل.`, "system");
    }

    if (hasPv && cablingResult.dcVoltageDropPercent > input.dcVoltageDropLimit) {
      pushMessage(messages, "warning", "کنترل کابل DC پنل: افت ولتاژ بالا", `افت مسیر پنل ${round(cablingResult.dcVoltageDropPercent, 2)}٪ است. سایز بعدی پیشنهادی: ${nextCableSize(cablingResult.dcCableSizeMm2)}mm² یا افزایش ولتاژ رشته.`, "system");
    }

    if (cablingResult.acVoltageDropPercent > input.acVoltageDropLimit) {
      pushMessage(messages, "warning", "کنترل کابل AC: افت ولتاژ بالا", `افت مسیر AC حدود ${round(cablingResult.acVoltageDropPercent, 2)}٪ است. سایز بعدی پیشنهادی: ${nextCableSize(cablingResult.acCableSizeMm2)}mm² یا کوتاه‌کردن مسیر.`, "system");
    }

    if (systemIsBatteryBased && cablingResult.batteryCurrentA > 250) {
      pushMessage(messages, "warning", "کنترل جریان باتری: جریان بسیار بالا", `جریان DC باتری حدود ${round(cablingResult.batteryCurrentA, 0)}A است. برای اجرا، شینه DC، کابل موازی، فیوز DC مناسب و افزایش ولتاژ سیستم باید بررسی شود.`, "system");
    }
  }

  if (protectionResult) {
    if (systemIsBatteryBased && protectionResult.batteryFuseA > 400) {
      pushMessage(messages, "error", "کنترل حفاظت: فیوز باتری غیرمعمول", `فیوز باتری ${protectionResult.batteryFuseA}A محاسبه شده است. این سطح جریان برای یک مسیر واحد مناسب نیست؛ سیستم را به چند شاخه DC تقسیم کن یا ولتاژ DC را بالا ببر.`, "system");
    }
    if (hasPv && protectionResult.dcFuseA > 250) {
      pushMessage(messages, "warning", "کنترل حفاظت DC: جریان فیوز بالا", `فیوز DC هر MPPT حدود ${protectionResult.dcFuseA}A است. تعداد کنترلر/رشته‌ها و کابل‌کشی موازی باید اجرایی بازبینی شود.`, "system");
    }
  }

  if (simulationResult?.summary && input.systemType !== "gridtie") {
    const unserved = simulationResult.summary.unservedLoadWh || 0;
    if (unserved > loadResult.totalDailyEnergyWh * 0.05) {
      pushMessage(messages, "error", "کنترل شبیه‌سازی: انرژی تامین‌نشده", `در شبیه‌سازی 24 ساعته حدود ${round(unserved, 0)}Wh انرژی تامین‌نشده دیده می‌شود. ظرفیت باتری/پنل یا زمان‌بندی بارها باید اصلاح شود.`, "review");
    }
  }
}

export function generateAdvisorMessages(input, loadResult, batteryResult, pvResult, inverterResult, controllerResult, cablingResult, protectionResult, simulationResult, industrialResult) {
  const messages = [];

  addEngineeringGateChecks(messages, input, loadResult, batteryResult, pvResult, inverterResult, controllerResult, cablingResult, protectionResult, simulationResult, industrialResult);

  if (industrialResult?.serviceabilityScore < 70) {
    pushMessage(messages, "warning", "امتیاز صنعتی طراحی پایین است", `امتیاز قابلیت اجرا ${industrialResult.serviceabilityScore} از 100 است. ${industrialResult.actionItems?.[0] || "پارامترهای باتری، پنل و جریان DC را بازبینی کنید."}`, "review");
  }

  if (industrialResult?.currentStress === "critical") {
    pushMessage(messages, "error", "جریان DC بحرانی است", `جریان لحظه‌ای DC حدود ${industrialResult.dcCurrentAtSurgeA}A است. افزایش ولتاژ سیستم به ${industrialResult.recommendedDcVoltage}V یا تقسیم بانک/اینورتر توصیه می‌شود.`, "system");
  }

  if (industrialResult?.backupCoverageRatio < 1) {
    pushMessage(messages, "error", "پوشش بکاپ کمتر از درخواست مشتری", `پشتیبانی واقعی ${industrialResult.realBackupHours} ساعت است، در حالی که هدف ${industrialResult.requiredBackupHours} ساعت وارد شده است.`, "system");
  }

  if (input.systemType === "offgrid" && batteryResult.realAutonomyDays < input.daysAutonomy) {
    pushMessage(messages, "error", "خودمختاری باتری ناکافی", `بانک باتری حدود ${batteryResult.realAutonomyDays} روز انرژی می‌دهد و از هدف ${input.daysAutonomy} روز کمتر است. ظرفیت یا تعداد موازی را افزایش دهید.`, "system");
  }

  if (input.systemType !== "gridtie" && input.systemType !== "offgrid" && batteryResult.realBackupHours < input.backupHours) {
    pushMessage(messages, "error", "زمان پشتیبانی ناکافی", "بانک باتری زمان پشتیبانی موردنیاز را پوشش نمی‌دهد و باید ظرفیت یا تعداد موازی افزایش یابد.", "system");
  }

  if (input.systemType !== "gridtie" && batteryResult.dischargeCRate > batteryResult.recommendedDischargeC) {
    pushMessage(messages, "warning", "نرخ دشارژ باتری بالا است", `نرخ دشارژ تقریبی ${batteryResult.dischargeCRate}C از محدوده مناسب برای ${batteryResult.chemistry} بالاتر است.`, "system");
  }

  if (input.systemType !== "backup" && input.systemType !== "gridtie" && batteryResult.chargeCRate > batteryResult.recommendedChargeC) {
    pushMessage(messages, "warning", "نرخ شارژ بالا است", `جریان شارژ تقریبی باتری ${batteryResult.chargeCRate}C است و بهتر است با ظرفیت بزرگ‌تر یا آرایه متعادل‌تر طراحی شود.`, "system");
  }

  if (inverterResult.utilizationRatio > 0.9 || inverterResult.apparentUtilizationRatio > 0.9) {
    pushMessage(messages, "warning", "اینورتر در مرز ظرفیت", "نسبت بار مؤثر یا بار ظاهری به ظرفیت اینورتر بالاست و بهتر است یک پله ظرفیت بالاتر انتخاب شود.", "system");
  }

  if (loadResult.averagePowerFactor < 0.85) {
    pushMessage(messages, "warning", "ضریب توان پایین بارها", "ضریب توان میانگین حدود " + loadResult.averagePowerFactor + " است؛ ظرفیت VA اینورتر و جریان کابل باید با حاشیه بیشتری انتخاب شود.", "loads");
  }

  if (loadResult.surgePowerW > inverterResult.surgePowerW) {
    pushMessage(messages, "error", "پیک راه‌اندازی بیش از حد اینورتر", "توان لحظه‌ای موردنیاز بارها از توان surge پیشنهادی اینورتر بیشتر است.", "loads");
  }

  if (input.systemType !== "backup" && pvResult) {
    if (pvResult.performanceRatio < 0.72) {
      pushMessage(messages, "warning", "افت عملکرد آرایه", "شرایط دما، سایه، گردوغبار یا کابل باعث افت محسوس عملکرد آرایه شده است.", "site");
    }

    if (industrialResult?.pvCoverageRatio < 0.95 && input.systemType === "offgrid") {
      pushMessage(messages, "warning", "پوشش انرژی خورشیدی ناکافی", `آرایه فعلی حدود ${Math.round((industrialResult.pvCoverageRatio || 0) * 100)}٪ انرژی روزانه را پوشش می‌دهد. کمبود روزانه ${industrialResult.pvShortageWh}Wh است.`, "site");
    }

    if (pvResult.stringingWastePanels > 0) {
      pushMessage(messages, "info", "تکمیل آرایش سری/موازی پنل", "برای رسیدن به آرایش منظم رشته‌ها، " + pvResult.stringingWastePanels + " پنل به تعداد خام محاسبه‌شده اضافه شد.", "system");
    }

    if (pvResult.stringVocCold >= input.controllerMaxVoc) {
      pushMessage(messages, "error", "ولتاژ Voc رشته بیش از حد مجاز است", "در شرایط سرد، ولتاژ مدار باز رشته پنل از حد مجاز کنترلر/MPPT عبور می‌کند.", "system");
    }

    if (pvResult.stringVmp < input.mpptMinVoltage || pvResult.stringVmp > input.mpptMaxVoltage) {
      pushMessage(messages, "warning", "رشته پنل خارج از محدوده MPPT است", "ولتاژ کاری رشته پنل با پنجره MPPT فعلی بهینه نیست و باید تعداد سری بازبینی شود.", "system");
    }

    if (pvResult.estimatedDailyProductionWh < loadResult.totalDailyEnergyWh * 0.95 && input.systemType === "offgrid") {
      pushMessage(messages, "warning", "تولید روزانه مرزی است", "تولید تخمینی آرایه خورشیدی به بار روزانه بسیار نزدیک است و حاشیه اطمینان کمی دارد.", "site");
    }

    if (input.systemType === "gridtie") {
      const offset = pvResult.energyTargetFactor * 100;
      pushMessage(messages, "info", "جبران انرژی شبکه", `طراحی Grid-Tie برای حدود ${Math.round(offset)}% جبران انرژی مصرفی هدف گذاری شده است.`, "review");
    }

    if (input.systemType === "hybrid") {
      const modeLabel = input.hybridMode === "backup_priority" ? "اولویت پشتیبانی" : input.hybridMode === "peak_shaving" ? "کاهش پیک" : "خودمصرفی";
      pushMessage(messages, "info", "استراتژی هیبرید", `طراحی هیبرید با استراتژی «${modeLabel}» شبیه سازی شده است.`, "system");
    }
  }

  if (controllerResult?.controllerCount > 1) {
    pushMessage(messages, "info", "تقسیم شارژ کنترلر", `جریان MPPT به صورت ${controllerResult.controllerCount} دستگاه ${controllerResult.perControllerA} آمپر پیشنهاد شد تا از انتخاب کنترلر غیرواقعی جلوگیری شود.`, "system");
  }

  if (controllerResult) {
    if (!controllerResult.vocOk) pushMessage(messages, "error", "ولتاژ ورودی کنترلر نامعتبر است", "Voc سرد رشته پنل از حد مجاز کنترلر عبور می کند و آرایش سری باید اصلاح شود.", "system");
    if (!controllerResult.mpptWindowOk) pushMessage(messages, "warning", "پنجره MPPT بهینه نیست", "ولتاژ کاری رشته پنل خارج از محدوده بهینه MPPT است و بازبینی تعداد سری توصیه می شود.", "system");
  }

  if (cablingResult) {
    if (cablingResult.batteryVoltageDropPercent > input.batteryVoltageDropLimit && input.systemType !== "gridtie") {
      pushMessage(messages, "warning", "افت ولتاژ مسیر باتری بالا است", `افت ولتاژ مسیر باتری ${cablingResult.batteryVoltageDropPercent}% است و بهتر است سطح مقطع کابل افزایش یابد.`, "system");
    }
    if (input.systemType !== "backup" && cablingResult.dcVoltageDropPercent > input.dcVoltageDropLimit) {
      pushMessage(messages, "warning", "افت ولتاژ مسیر DC پنل بالا است", `افت ولتاژ مسیر DC حدود ${cablingResult.dcVoltageDropPercent}% است و باید کابل یا آرایش پنل بازبینی شود.`, "system");
    }
    if (cablingResult.acVoltageDropPercent > input.acVoltageDropLimit) {
      pushMessage(messages, "warning", "افت ولتاژ مسیر AC بالا است", `افت ولتاژ مسیر AC حدود ${cablingResult.acVoltageDropPercent}% است و بهتر است سطح مقطع کابل خروجی افزایش یابد.`, "system");
    }
  }

  if (simulationResult?.summary) {
    if (simulationResult.summary.unservedLoadWh > loadResult.totalDailyEnergyWh * 0.03) {
      pushMessage(messages, "warning", "کمبود انرژی در شبیه سازی", "در شبیه سازی روزانه، بخشی از بار بدون تامین مانده است و بهتر است ظرفیت باتری یا آرایه افزایش یابد.", "review");
    }
    if (input.systemType === "gridtie" && simulationResult.summary.gridImportWh > loadResult.totalDailyEnergyWh * 0.35) {
      pushMessage(messages, "info", "وابستگی محسوس به شبکه", "با وجود آرایه فعلی، سهم واردات از شبکه هنوز بالاست و برای جبران بیشتر باید توان PV افزایش یابد.", "review");
    }
  }

  if (loadResult.demandPowerW > 7000 && input.systemVoltage < 48 && input.systemType !== "gridtie") {
    pushMessage(messages, "warning", "ولتاژ سیستم پایین است", "برای این سطح توان، ولتاژ 48 ولت یا بالاتر پیشنهاد می‌شود تا جریان‌های DC کنترل شوند.", "system");
  }

  if (loadResult.demandPowerW > 12000 && input.systemVoltage < 96 && input.systemType !== "gridtie") {
    pushMessage(messages, "warning", "جریان DC بسیار بالا است", "برای توان‌های بالای 12 کیلووات، طراحی 96V یا تقسیم سیستم به چند اینورتر/بانک موازی توصیه می‌شود تا کابل باتری و فیوزها غیرواقعی نشوند.", "system");
  }

  if (messages.length === 0) {
    pushMessage(messages, "info", "طراحی پایه معتبر است", "در این مرحله، طراحی بدون خطای بحرانی ارزیابی شد و می‌تواند وارد فاز بهینه‌سازی شود.", "review");
  }

  return uniqueMessages(messages);
}
