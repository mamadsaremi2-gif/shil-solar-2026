function pushMessage(list, severity, title, message, relatedStep = "review") {
  list.push({ severity, title, message, relatedStep });
}

export function generateAdvisorMessages(input, loadResult, batteryResult, pvResult, inverterResult, controllerResult, cablingResult, protectionResult, simulationResult) {
  const messages = [];

  if (input.systemType !== "gridtie" && batteryResult.realBackupHours < input.backupHours) {
    pushMessage(messages, "error", "زمان پشتیبانی ناکافی", "بانک باتری زمان پشتیبانی موردنیاز را پوشش نمی‌دهد و باید ظرفیت یا تعداد موازی افزایش یابد.", "system");
  }

  if (input.systemType !== "gridtie" && batteryResult.dischargeCRate > batteryResult.recommendedDischargeC) {
    pushMessage(messages, "warning", "نرخ دشارژ باتری بالا است", `نرخ دشارژ تقریبی ${batteryResult.dischargeCRate}C از محدوده مناسب برای ${batteryResult.chemistry} بالاتر است.`, "system");
  }

  if (input.systemType !== "backup" && input.systemType !== "gridtie" && batteryResult.chargeCRate > batteryResult.recommendedChargeC) {
    pushMessage(messages, "warning", "نرخ شارژ بالا است", `جریان شارژ تقریبی باتری ${batteryResult.chargeCRate}C است و بهتر است با ظرفیت بزرگ‌تر یا آرایه متعادل‌تر طراحی شود.`, "system");
  }

  if (inverterResult.utilizationRatio > 0.9) {
    pushMessage(messages, "warning", "اینورتر در مرز ظرفیت", "نسبت بار مؤثر به توان اینورتر بالاست و بهتر است یک پله ظرفیت بالاتر انتخاب شود.", "system");
  }

  if (loadResult.surgePowerW > inverterResult.surgePowerW) {
    pushMessage(messages, "error", "پیک راه‌اندازی بیش از حد اینورتر", "توان لحظه‌ای موردنیاز بارها از توان surge پیشنهادی اینورتر بیشتر است.", "loads");
  }

  if (input.systemType !== "backup" && pvResult) {
    if (pvResult.performanceRatio < 0.72) {
      pushMessage(messages, "warning", "افت عملکرد آرایه", "شرایط دما، سایه، گردوغبار یا کابل باعث افت محسوس عملکرد آرایه شده است.", "site");
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

  if (controllerResult) {
    if (!controllerResult.vocOk) {
      pushMessage(messages, "error", "ولتاژ ورودی کنترلر نامعتبر است", "Voc سرد رشته پنل از حد مجاز کنترلر عبور می کند و آرایش سری باید اصلاح شود.", "system");
    }
    if (!controllerResult.mpptWindowOk) {
      pushMessage(messages, "warning", "پنجره MPPT بهینه نیست", "ولتاژ کاری رشته پنل خارج از محدوده بهینه MPPT است و بازبینی تعداد سری توصیه می شود.", "system");
    }
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
      pushMessage(messages, "notice", "وابستگی محسوس به شبکه", "با وجود آرایه فعلی، سهم واردات از شبکه هنوز بالاست و برای جبران بیشتر باید توان PV افزایش یابد.", "review");
    }
  }

  if (loadResult.demandPowerW > 7000 && input.systemVoltage < 48 && input.systemType !== "gridtie") {
    pushMessage(messages, "warning", "ولتاژ سیستم پایین است", "برای این سطح توان، ولتاژ 48 ولت یا بالاتر پیشنهاد می‌شود تا جریان‌های DC کنترل شوند.", "system");
  }

  if (messages.length === 0) {
    pushMessage(messages, "info", "طراحی پایه معتبر است", "در این مرحله، طراحی بدون خطای بحرانی ارزیابی شد و می‌تواند وارد فاز بهینه‌سازی شود.", "review");
  }

  return messages;
}
