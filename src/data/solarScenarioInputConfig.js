export const SOLAR_SCENARIO_INPUTS = {
  offgrid: {
    key: "offgrid",
    title: "آفگرید",
    engineType: "offgrid",
    description: "طراحی مستقل از شبکه با پنل، باتری، اینورتر آفگرید، استرینگ و حفاظت DC/AC.",
    requiredOutputs: ["ظرفیت پنل", "ظرفیت باتری", "اینورتر آفگرید", "استرینگ", "حفاظت", "کابل"],
    fields: [
      { key: "dailyEnergyKWh", label: "مصرف روزانه", unit: "kWh/day", defaultValue: "12", type: "number" },
      { key: "peakLoadW", label: "پیک بار همزمان", unit: "W", defaultValue: "3500", type: "number" },
      { key: "surgeFactor", label: "ضریب راه‌اندازی بار موتوری", unit: "×", defaultValue: "2.5", type: "number" },
      { key: "autonomyDays", label: "روزهای پشتیبانی باتری", unit: "day", defaultValue: "1", type: "number" },
      { key: "systemVoltage", label: "ولتاژ DC سیستم", unit: "V", defaultValue: "48", type: "select", options: ["12", "24", "48"] },
      { key: "batteryDod", label: "عمق دشارژ مجاز", unit: "%", defaultValue: "90", type: "number" },
      { key: "criticalLoadOnly", label: "فقط بارهای ضروری", unit: "", defaultValue: "خیر", type: "select", options: ["خیر", "بله"] }
    ]
  },
  hybrid: {
    key: "hybrid",
    title: "هیبرید",
    engineType: "hybrid",
    description: "ترکیب پنل، شبکه و باتری با اولویت منبع، شارژ از خورشید/برق شهر و بکاپ کنترل‌شده.",
    requiredOutputs: ["ظرفیت پنل", "اینورتر هیبرید", "باتری بکاپ", "اولویت منبع", "حفاظت", "کابل"],
    fields: [
      { key: "dailyEnergyKWh", label: "مصرف روزانه", unit: "kWh/day", defaultValue: "18", type: "number" },
      { key: "peakLoadW", label: "پیک بار", unit: "W", defaultValue: "5000", type: "number" },
      { key: "backupHours", label: "زمان بکاپ مورد نیاز", unit: "h", defaultValue: "4", type: "number" },
      { key: "gridAvailability", label: "کیفیت/دسترسی شبکه", unit: "", defaultValue: "متوسط", type: "select", options: ["ضعیف", "متوسط", "خوب"] },
      { key: "sourcePriority", label: "اولویت منبع", unit: "", defaultValue: "خورشید-باتری-شبکه", type: "select", options: ["خورشید-باتری-شبکه", "خورشید-شبکه-باتری", "شبکه-خورشید-باتری"] },
      { key: "allowGridCharging", label: "شارژ باتری از شبکه", unit: "", defaultValue: "بله", type: "select", options: ["بله", "خیر"] }
    ]
  },
  ongrid: {
    key: "ongrid",
    title: "آنگرید",
    engineType: "ongrid",
    description: "طراحی متصل به شبکه بدون باتری؛ تمرکز روی ظرفیت تزریق، تولید سالانه و محدودیت شبکه.",
    requiredOutputs: ["ظرفیت DC پنل", "اینورتر آنگرید", "استرینگ", "تولید انرژی", "تزریق", "حفاظت AC/DC"],
    fields: [
      { key: "targetCapacityKW", label: "ظرفیت هدف نیروگاه", unit: "kW", defaultValue: "10", type: "number" },
      { key: "exportLimitKW", label: "محدودیت تزریق شبکه", unit: "kW", defaultValue: "10", type: "number" },
      { key: "gridVoltage", label: "ولتاژ اتصال شبکه", unit: "V", defaultValue: "380", type: "select", options: ["220", "380"] },
      { key: "phaseType", label: "نوع فاز", unit: "", defaultValue: "سه‌فاز", type: "select", options: ["تک‌فاز", "سه‌فاز"] },
      { key: "selfConsumptionPercent", label: "درصد مصرف داخلی", unit: "%", defaultValue: "40", type: "number" },
      { key: "batteryRequired", label: "باتری در این سناریو", unit: "", defaultValue: "خیر", type: "select", options: ["خیر"] }
    ]
  },
  backup: {
    key: "backup",
    title: "بکاپ اضطراری",
    engineType: "backup",
    description: "تغذیه بارهای ضروری در زمان قطع برق با باتری، اینورتر و امکان شارژ خورشیدی.",
    requiredOutputs: ["بار ضروری", "باتری اضطراری", "اینورتر", "زمان پشتیبانی", "شارژر/پنل کمکی"],
    fields: [
      { key: "essentialLoadW", label: "توان بارهای ضروری", unit: "W", defaultValue: "1800", type: "number" },
      { key: "backupHours", label: "زمان پشتیبانی", unit: "h", defaultValue: "6", type: "number" },
      { key: "restartSurgeW", label: "پیک راه‌اندازی بار ضروری", unit: "W", defaultValue: "3500", type: "number" },
      { key: "includeSolarCharging", label: "شارژ کمکی از پنل", unit: "", defaultValue: "بله", type: "select", options: ["بله", "خیر"] },
      { key: "batteryChemistry", label: "نوع باتری", unit: "", defaultValue: "LiFePO4", type: "select", options: ["LiFePO4", "AGM", "GEL"] }
    ]
  },
  pump: {
    key: "pump",
    title: "پمپ خورشیدی",
    engineType: "pump",
    description: "محاسبه انرژی و توان مورد نیاز پمپ بر اساس هد، دبی، ساعات پمپاژ و راندمان مسیر آب.",
    requiredOutputs: ["توان پمپ", "ظرفیت پنل", "کنترلر/اینورتر پمپ", "ساعات پمپاژ", "حفاظت"],
    fields: [
      { key: "flowM3H", label: "دبی آب", unit: "m³/h", defaultValue: "5", type: "number" },
      { key: "headM", label: "هد کل دینامیکی", unit: "m", defaultValue: "45", type: "number" },
      { key: "pumpHours", label: "ساعات پمپاژ روزانه", unit: "h", defaultValue: "5", type: "number" },
      { key: "pumpEfficiency", label: "راندمان پمپ و درایو", unit: "%", defaultValue: "55", type: "number" },
      { key: "waterStorage", label: "ذخیره آب", unit: "", defaultValue: "مخزن روزانه", type: "select", options: ["مخزن روزانه", "بدون مخزن", "مخزن چندروزه"] }
    ]
  },
  industrial: {
    key: "industrial",
    title: "صنعتی",
    engineType: "industrial",
    description: "طراحی بارهای صنعتی با ضریب همزمانی، موتور، راه‌اندازی، سه‌فاز و کنترل Surge.",
    requiredOutputs: ["پیک صنعتی", "Surge", "اینورتر/آرایه", "کابل سه‌فاز", "حفاظت صنعتی"],
    fields: [
      { key: "baseLoadKW", label: "بار پایه صنعتی", unit: "kW", defaultValue: "15", type: "number" },
      { key: "motorLoadKW", label: "توان بار موتوری", unit: "kW", defaultValue: "7.5", type: "number" },
      { key: "motorStartFactor", label: "ضریب راه‌اندازی موتور", unit: "×", defaultValue: "3", type: "number" },
      { key: "simultaneity", label: "ضریب همزمانی", unit: "%", defaultValue: "80", type: "number" },
      { key: "phaseType", label: "نوع شبکه داخلی", unit: "", defaultValue: "سه‌فاز", type: "select", options: ["سه‌فاز"] },
      { key: "softStarter", label: "سافت‌استارتر/درایو", unit: "", defaultValue: "دارد", type: "select", options: ["دارد", "ندارد"] }
    ]
  }
};

export function getSolarScenarioInputConfig(key) {
  return SOLAR_SCENARIO_INPUTS[key] || null;
}

export function buildDefaultSolarScenarioValues(config) {
  return Object.fromEntries((config?.fields || []).map((field) => [field.key, field.defaultValue ?? ""]));
}
