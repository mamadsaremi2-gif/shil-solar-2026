const CITY_POOL = [
  { city: "تهران", sunHours: 5.2, temp: 30 },
  { city: "اصفهان", sunHours: 5.6, temp: 31 },
  { city: "شیراز", sunHours: 5.7, temp: 29 },
  { city: "مشهد", sunHours: 5.4, temp: 27 },
  { city: "کرمان", sunHours: 5.9, temp: 32 },
  { city: "یزد", sunHours: 6.0, temp: 33 },
  { city: "تبریز", sunHours: 4.9, temp: 24 },
  { city: "رشت", sunHours: 4.2, temp: 25 },
  { city: "اهواز", sunHours: 5.5, temp: 38 },
  { city: "بندرعباس", sunHours: 5.8, temp: 36 },
  { city: "سنندج", sunHours: 5.1, temp: 25 },
  { city: "زاهدان", sunHours: 6.1, temp: 34 },
];

const LIGHT_PROJECTS = [
  "آپارتمان اقتصادی", "ویلای کوچک آخر هفته", "مغازه کوچک شهری", "دفتر کار کوچک", "کافی‌شاپ کوچک",
  "خانه روستایی سبک", "باغ کوچک", "داروخانه محلی", "خانه هوشمند اقتصادی", "فروشگاه موبایل",
  "دفتر بیمه", "سیستم دوربین مداربسته", "سوپرمارکت محلی", "اتاق سرور سبک", "گلخانه کوچک",
  "کانکس نگهبانی", "اقامتگاه بومگردی", "پمپ آب سبک", "دفتر معماری", "آموزشگاه کوچک"
];

const MEDIUM_PROJECTS = [
  "ویلای لوکس دوطبقه", "رستوران متوسط", "کارگاه صنعتی سبک", "گلخانه متوسط", "مزرعه آبیاری",
  "دفتر اداری", "هتل کوچک", "فروشگاه زنجیره‌ای", "مرکز درمانی", "کارگاه CNC",
  "کارخانه بسته‌بندی", "سالن ورزشی", "باشگاه بدنسازی", "مجتمع مسکونی", "پمپ آب کشاورزی",
  "استخر متوسط", "سردخانه کوچک", "رستوران بین‌راهی", "دفتر IT", "دامداری متوسط"
];

const HEAVY_PROJECTS = [
  "کارخانه صنعتی", "سردخانه صنعتی", "مرکز داده بزرگ", "مجتمع تجاری بزرگ", "بیمارستان",
  "کارخانه لبنیات", "دامداری صنعتی", "مرغداری صنعتی", "گلخانه عظیم", "ایستگاه مخابراتی",
  "کارخانه بسته‌بندی بزرگ", "تصفیه‌خانه آب", "هتل بزرگ", "برج تجاری", "شهرک صنعتی",
  "کارخانه داروسازی", "مرکز لجستیک", "پایگاه عملیاتی", "نیروگاه خورشیدی صنعتی", "کارخانه مواد غذایی"
];

const BACKUP_LIGHT_PROJECTS = [
  "برق اضطراری آپارتمان", "پشتیبان فروشگاه کوچک", "UPS دفتر کار", "پشتیبان دوربین مداربسته", "پشتیبان مودم و شبکه",
  "برق اضطراری خانه ویلایی", "پشتیبان یخچال و روشنایی", "پشتیبان مطب کوچک", "پشتیبان داروخانه محلی", "پشتیبان کانکس نگهبانی",
  "UPS اتاق سرور سبک", "پشتیبان پمپ آب سبک", "پشتیبان خانه روستایی", "پشتیبان کافی‌شاپ کوچک", "پشتیبان فروشگاه موبایل",
  "پشتیبان دفتر بیمه", "پشتیبان آموزشگاه کوچک", "پشتیبان آرایشگاه", "پشتیبان سوپرمارکت", "پشتیبان خانه هوشمند"
];

const BACKUP_MEDIUM_PROJECTS = [
  "برق اضطراری ویلا", "UPS رستوران متوسط", "پشتیبان دفتر اداری", "پشتیبان گلخانه متوسط", "پشتیبان کارگاه سبک",
  "پشتیبان مرکز درمانی", "UPS هتل کوچک", "پشتیبان فروشگاه زنجیره‌ای", "پشتیبان سردخانه کوچک", "پشتیبان پمپ کشاورزی",
  "پشتیبان سالن ورزشی", "پشتیبان مرکز IT", "UPS آزمایشگاه", "پشتیبان ساختمان اداری", "پشتیبان دامداری متوسط",
  "پشتیبان مرغداری متوسط", "پشتیبان رستوران بین‌راهی", "پشتیبان مرکز مخابرات", "پشتیبان ایستگاه پمپاژ", "UPS مرکز مانیتورینگ"
];

const BACKUP_HEAVY_PROJECTS = [
  "برق اضطراری کارخانه", "UPS سردخانه صنعتی", "پشتیبان مرکز داده", "پشتیبان بیمارستان", "پشتیبان مجتمع تجاری",
  "پشتیبان خط تولید", "پشتیبان دامداری صنعتی", "پشتیبان مرغداری صنعتی", "پشتیبان گلخانه عظیم", "پشتیبان ایستگاه مخابراتی",
  "UPS کارخانه داروسازی", "پشتیبان تصفیه‌خانه", "پشتیبان هتل بزرگ", "پشتیبان برج تجاری", "پشتیبان شهرک صنعتی",
  "پشتیبان مرکز لجستیک", "پشتیبان پایگاه عملیاتی", "UPS مرکز امنیت داده", "پشتیبان کارخانه مواد غذایی", "پشتیبان نیروگاه اضطراری"
];

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pad(num) {
  return String(num).padStart(3, "0");
}

function scenarioBand(index) {
  if (index <= 34) return "economic";
  if (index <= 67) return "standard";
  return "professional";
}

function sizeFa(size) {
  if (size === "light") return "سبک";
  if (size === "medium") return "متوسط";
  return "سنگین";
}

function bandFa(index) {
  const band = scenarioBand(index);
  return band === "economic" ? "اقتصادی" : band === "standard" ? "استاندارد" : "حرفه‌ای";
}

function autonomyFor(size, index, systemType) {
  if (systemType === "gridtie") return 0;
  const band = scenarioBand(index);
  if (size === "light") return band === "economic" ? 0.5 : band === "standard" ? 1 : 2;
  if (size === "medium") return band === "economic" ? 1 : band === "standard" ? 2 : 3;
  return band === "economic" ? 1 : band === "standard" ? 3 : 5;
}

function backupHoursFor(size, index) {
  const band = scenarioBand(index);
  if (size === "light") return band === "economic" ? 2 + (index % 3) : band === "standard" ? 4 + (index % 5) : 8 + (index % 8);
  if (size === "medium") return band === "economic" ? 3 + (index % 4) : band === "standard" ? 6 + (index % 6) : 12 + (index % 10);
  return band === "economic" ? 2 + (index % 5) : band === "standard" ? 6 + (index % 8) : 12 + (index % 13);
}

function energyFor(size, index) {
  const step = (index - 1) % 100;
  if (size === "light") return round(2.8 + (step * 0.092), 1);
  if (size === "medium") return round(12.2 + (step * 0.23), 1);
  return round(36 + (step * 2.7), 1);
}

function backupPowerFor(size, index) {
  const step = (index - 1) % 100;
  if (size === "light") return Math.round(250 + step * 23);       // 250W - 2527W
  if (size === "medium") return Math.round(1800 + step * 63);     // 1.8kW - 8kW
  return Math.round(9000 + step * 520);                            // 9kW - 60kW
}

function solarSystemTypeFor(size, index) {
  if (size === "light") return index % 6 === 0 ? "hybrid" : index % 17 === 0 ? "gridtie" : "offgrid";
  if (size === "medium") return index % 4 === 0 ? "hybrid" : index % 13 === 0 ? "gridtie" : "offgrid";
  return index % 5 === 0 ? "hybrid" : index % 19 === 0 ? "gridtie" : "offgrid";
}

function systemVoltageFor(energyOrPower, systemType) {
  if (systemType === "backup") {
    if (energyOrPower > 12000) return 96;
    if (energyOrPower > 2500) return 48;
    if (energyOrPower > 900) return 24;
    return 12;
  }
  if (energyOrPower > 80) return 96;
  if (energyOrPower > 20) return 48;
  return energyOrPower > 7 ? 48 : 24;
}

function batteryAhFor(size, energy, autonomyDays, systemVoltage) {
  const usable = systemVoltage * 0.9 * 0.95;
  const base = (energy * 1000 * Math.max(autonomyDays, 0.25)) / Math.max(usable, 1);
  const reserve = size === "heavy" ? 1.25 : size === "medium" ? 1.15 : 1.1;
  return roundBatteryAh(base * reserve);
}

function backupBatteryAhFor(size, demandPowerW, backupHours, systemVoltage) {
  const usable = systemVoltage * 0.9 * 0.95;
  const base = (demandPowerW * backupHours) / Math.max(usable, 1);
  const reserve = size === "heavy" ? 1.2 : size === "medium" ? 1.15 : 1.1;
  return roundBatteryAh(base * reserve);
}

function roundBatteryAh(raw) {
  if (raw <= 100) return 100;
  if (raw <= 150) return 150;
  if (raw <= 200) return 200;
  if (raw <= 300) return 300;
  if (raw <= 400) return 400;
  if (raw <= 600) return 600;
  if (raw <= 800) return 800;
  if (raw <= 1000) return 1000;
  return Math.ceil(raw / 500) * 500;
}

function inverterKwFor(energy, size) {
  const factor = size === "heavy" ? 0.42 : size === "medium" ? 0.5 : 0.65;
  const raw = Math.max(1.6, energy * factor);
  return roundInverterKw(raw);
}

function backupInverterKwFor(demandPowerW, size) {
  const reserve = size === "heavy" ? 1.22 : size === "medium" ? 1.28 : 1.35;
  return roundInverterKw((demandPowerW * reserve) / 1000);
}

function roundInverterKw(raw) {
  if (raw <= 2) return 2;
  if (raw <= 3.2) return 3.2;
  if (raw <= 5) return 5;
  if (raw <= 6) return 6;
  if (raw <= 8) return 8;
  if (raw <= 11) return 11;
  if (raw <= 15) return 15;
  if (raw <= 20) return 20;
  if (raw <= 30) return 30;
  if (raw <= 50) return 50;
  if (raw <= 80) return 80;
  return Math.ceil(raw / 25) * 25;
}

function buildSolarLoads(size, energy, index) {
  const targetWh = energy * 1000;
  const criticalWh = targetWh * 0.38;
  const importantWh = targetWh * 0.34;
  const optionalWh = targetWh * 0.28;
  const motorPower = size === "heavy" ? 5500 + (index % 8) * 750 : size === "medium" ? 1100 + (index % 5) * 350 : 180 + (index % 4) * 120;
  const coolingPower = size === "heavy" ? 9000 + (index % 7) * 1200 : size === "medium" ? 1800 + (index % 4) * 450 : 400 + (index % 3) * 150;
  return [
    {
      name: size === "heavy" ? "بارهای حیاتی خط تولید / کنترل" : size === "medium" ? "روشنایی و تجهیزات اصلی" : "روشنایی و تجهیزات ضروری",
      qty: size === "heavy" ? 12 + (index % 8) : size === "medium" ? 6 + (index % 6) : 4 + (index % 5),
      power: round(criticalWh / Math.max((size === "heavy" ? 14 : size === "medium" ? 10 : 7) * (size === "heavy" ? 14 : size === "medium" ? 8 : 5), 1), 0),
      hours: size === "heavy" ? 14 : size === "medium" ? 10 : 7,
      powerFactor: 0.95,
      coincidenceFactor: 0.85,
      seasonalUseFactor: 1,
      loadType: "resistive",
      loadPriority: "critical",
      inverterSupply: "with_inverter",
      surgeFactor: 1
    },
    {
      name: size === "heavy" ? "موتورها و پمپ‌های عملیاتی" : size === "medium" ? "پمپ / موتور مصرفی" : "یخچال، پمپ یا بار موتوری سبک",
      qty: size === "heavy" ? 2 + (index % 4) : 1 + (index % 2),
      power: motorPower,
      hours: round(importantWh / Math.max(motorPower * (size === "heavy" ? 3 : size === "medium" ? 2 : 1), 1), 1),
      powerFactor: 0.82,
      coincidenceFactor: 0.65,
      seasonalUseFactor: 1,
      loadType: "motor",
      loadPriority: "important",
      inverterSupply: "with_inverter",
      surgeFactor: size === "heavy" ? 3.5 : 3
    },
    {
      name: size === "heavy" ? "تهویه، سرمایش و بارهای غیرحیاتی" : size === "medium" ? "تهویه / سرمایش / تجهیزات جانبی" : "تلویزیون، مودم و بارهای رفاهی",
      qty: size === "heavy" ? 2 + (index % 3) : 1,
      power: coolingPower,
      hours: round(optionalWh / Math.max(coolingPower, 1), 1),
      powerFactor: 0.9,
      coincidenceFactor: 0.7,
      seasonalUseFactor: 0.85,
      loadType: "switching",
      loadPriority: "optional",
      inverterSupply: "with_inverter",
      surgeFactor: size === "heavy" ? 2 : 1.5
    }
  ];
}

function buildBackupLoads(size, demandPowerW, backupHours, index) {
  const criticalW = Math.max(60, demandPowerW * 0.45);
  const importantW = Math.max(80, demandPowerW * 0.35);
  const optionalW = Math.max(40, demandPowerW * 0.2);
  const motorShare = size === "light" ? 0.18 : size === "medium" ? 0.28 : 0.38;
  return [
    {
      name: size === "heavy" ? "بارهای حیاتی کنترل و ایمنی" : size === "medium" ? "بارهای حیاتی مجموعه" : "روشنایی و تجهیزات حیاتی",
      qty: size === "heavy" ? 10 + (index % 8) : size === "medium" ? 5 + (index % 5) : 3 + (index % 4),
      power: round(criticalW / Math.max(size === "heavy" ? 14 : size === "medium" ? 7 : 4, 1), 0),
      hours: backupHours,
      backupHours,
      powerFactor: 0.96,
      coincidenceFactor: 1,
      seasonalUseFactor: 1,
      loadType: "resistive",
      loadPriority: "critical",
      inverterSupply: "with_inverter",
      surgeFactor: 1
    },
    {
      name: size === "heavy" ? "موتور / پمپ ضروری اضطراری" : size === "medium" ? "پمپ یا موتور ضروری" : "یخچال یا پمپ ضروری",
      qty: size === "heavy" ? 1 + (index % 3) : 1,
      power: round(Math.max(importantW * motorShare, size === "heavy" ? 2500 : size === "medium" ? 900 : 180), 0),
      hours: backupHours,
      backupHours,
      powerFactor: 0.82,
      coincidenceFactor: size === "heavy" ? 0.75 : 0.8,
      seasonalUseFactor: 1,
      loadType: "motor",
      loadPriority: "important",
      inverterSupply: "with_inverter",
      surgeFactor: size === "heavy" ? 3.5 : 3
    },
    {
      name: size === "heavy" ? "بارهای قابل حذف در وضعیت بحرانی" : size === "medium" ? "تجهیزات جانبی قابل مدیریت" : "مودم، شارژر و بارهای رفاهی",
      qty: size === "heavy" ? 2 + (index % 4) : size === "medium" ? 1 + (index % 2) : 1,
      power: round(optionalW / Math.max(size === "heavy" ? 3 : size === "medium" ? 2 : 1, 1), 0),
      hours: backupHours,
      backupHours,
      powerFactor: 0.9,
      coincidenceFactor: 0.65,
      seasonalUseFactor: 1,
      loadType: "switching",
      loadPriority: "optional",
      inverterSupply: "with_inverter",
      surgeFactor: size === "heavy" ? 1.8 : 1.4
    }
  ];
}

function buildSolarScenario(size, index) {
  const idPrefix = size === "light" ? "SOLAR-LIGHT" : size === "medium" ? "SOLAR-MEDIUM" : "SOLAR-HEAVY";
  const titles = size === "light" ? LIGHT_PROJECTS : size === "medium" ? MEDIUM_PROJECTS : HEAVY_PROJECTS;
  const energy = energyFor(size, index);
  const systemType = solarSystemTypeFor(size, index);
  const autonomyDays = autonomyFor(size, index, systemType);
  const cityMeta = CITY_POOL[(index - 1) % CITY_POOL.length];
  const systemVoltage = systemVoltageFor(energy, systemType);
  const panelWatt = size === "heavy" ? 700 : index % 2 ? 620 : 585;
  const expectedPvKw = round((energy / Math.max(cityMeta.sunHours * 0.72, 1)) * (systemType === "offgrid" ? 1.25 : systemType === "hybrid" ? 1.1 : 0.85), 1);
  const panelCount = Math.max(1, Math.ceil((expectedPvKw * 1000) / panelWatt));
  const batteryAh = systemType === "gridtie" ? 0 : batteryAhFor(size, energy, autonomyDays || 0.25, systemVoltage);
  const inverterKw = inverterKwFor(energy, size);
  const baseTitle = titles[(index - 1) % titles.length];
  const title = `${baseTitle} - خورشیدی ${sizeFa(size)} ${bandFa(index)} ${pad(index)}`;
  const batteryVoltage = systemVoltage >= 48 ? 51.2 : systemVoltage >= 24 ? 25.6 : 12.8;
  const hybridMode = index % 2 === 0 ? "backup_priority" : "self_consumption";

  return {
    id: `${idPrefix}-${pad(index)}`,
    scenarioFamily: "solar",
    scenarioSize: size,
    title,
    category: sizeFa(size),
    systemType,
    bestFor: `${baseTitle} با مصرف ${energy} kWh/day، پنل خورشیدی و ${autonomyDays} روز خودکفایی`,
    tags: ["خورشیدی", sizeFa(size), bandFa(index), cityMeta.city, systemType, `${autonomyDays} روز خودکفایی`],
    summary: `سناریوی آماده خورشیدی ${sizeFa(size)} برای ${baseTitle} در ${cityMeta.city} با مصرف روزانه ${energy} کیلووات‌ساعت.`,
    package: {
      dailyEnergyKwh: energy,
      autonomyDays,
      backupHours: systemType === "gridtie" ? 0 : size === "light" ? 8 : size === "medium" ? 10 : 12,
      panel: `SHIL-${panelWatt}W × ${panelCount}`,
      battery: systemType === "gridtie" ? "بدون باتری" : `SHIL Lithium ${batteryVoltage}V ${batteryAh}Ah`,
      inverter: `SHIL ${systemType === "hybrid" ? "Hybrid" : systemType === "gridtie" ? "Grid-Tie" : "Off-Grid"} ${inverterKw}kW ${systemVoltage}V`,
      expectedPvKw,
      note: `طراحی خورشیدی با ${autonomyDays} روز خودکفایی برای روزهای ابری و قطعی شبکه.`
    },
    patch: {
      projectTitle: title,
      scenarioFamily: "solar",
      systemType,
      hybridMode,
      calculationMode: "loads",
      city: cityMeta.city,
      loadVoltage: 220,
      backupHours: systemType === "gridtie" ? 0 : size === "light" ? 8 : size === "medium" ? 10 : 12,
      daysAutonomy: autonomyDays,
      dailyEnergyKwh: energy,
      dailyUsageHours: 3,
      seasonProfile: "annual",
      seasonUsageFactor: 1,
      sunHours: cityMeta.sunHours,
      averageTemperature: cityMeta.temp,
      systemVoltage,
      batteryType: "LFP",
      batteryUnitVoltage: batteryVoltage,
      batteryUnitAh: Math.max(batteryAh, 100),
      batteryRoundTripEfficiency: 0.96,
      dod: 0.9,
      panelWatt,
      panelVoc: panelWatt >= 700 ? 58.5 : panelWatt >= 620 ? 53.5 : 49.5,
      panelVmp: panelWatt >= 700 ? 48.5 : panelWatt >= 620 ? 44.5 : 41.5,
      panelTempCoeffVoc: 0.0025,
      panelTypeTemperatureFactor: 0.29,
      inverterEfficiency: systemType === "hybrid" ? 0.965 : 0.95,
      inverterRatedPowerW: inverterKw * 1000,
      inverterAcPowerW: inverterKw * 1000,
      mpptCount: size === "heavy" ? 4 : size === "medium" ? 2 : 1,
      maxPvVocV: size === "heavy" ? 1000 : 500,
      mpptMinVoltage: size === "heavy" ? 250 : 120,
      mpptMaxVoltage: size === "heavy" ? 850 : 450,
      targetOffsetPercent: systemType === "hybrid" ? 80 : 100,
      selectedEquipment: { panel: null, battery: null, inverter: null, controller: null },
      loadItems: buildSolarLoads(size, energy, index)
    }
  };
}

function buildBackupScenario(size, index) {
  const idPrefix = size === "light" ? "BACKUP-LIGHT" : size === "medium" ? "BACKUP-MEDIUM" : "BACKUP-HEAVY";
  const titles = size === "light" ? BACKUP_LIGHT_PROJECTS : size === "medium" ? BACKUP_MEDIUM_PROJECTS : BACKUP_HEAVY_PROJECTS;
  const demandPowerW = backupPowerFor(size, index);
  const backupHours = backupHoursFor(size, index);
  const cityMeta = CITY_POOL[(index - 1) % CITY_POOL.length];
  const systemVoltage = systemVoltageFor(demandPowerW, "backup");
  const batteryVoltage = systemVoltage >= 48 ? 51.2 : systemVoltage >= 24 ? 25.6 : 12.8;
  const batteryAh = backupBatteryAhFor(size, demandPowerW, backupHours, systemVoltage);
  const inverterKw = backupInverterKwFor(demandPowerW, size);
  const baseTitle = titles[(index - 1) % titles.length];
  const title = `${baseTitle} - برق اضطراری ${sizeFa(size)} ${bandFa(index)} ${pad(index)}`;
  const backupEnergyKwh = round((demandPowerW * backupHours) / 1000, 1);

  return {
    id: `${idPrefix}-${pad(index)}`,
    scenarioFamily: "backup",
    scenarioSize: size,
    title,
    category: sizeFa(size),
    systemType: "backup",
    bestFor: `${baseTitle} با توان اضطراری ${round(demandPowerW / 1000, 1)} kW و ${backupHours} ساعت پشتیبانی بدون پنل`,
    tags: ["برق اضطراری", "بدون پنل", sizeFa(size), bandFa(index), cityMeta.city, `${backupHours} ساعت بکاپ`],
    summary: `سناریوی آماده برق اضطراری ${sizeFa(size)} برای ${baseTitle}؛ مبنای محاسبه فقط توان مصرف‌کننده و ساعت بکاپ است، نه فصل کارکرد یا زمان مصرف روزانه.`,
    package: {
      dailyEnergyKwh: backupEnergyKwh,
      backupHours,
      autonomyDays: 0,
      panel: "بدون پنل خورشیدی",
      battery: `SHIL Backup Lithium ${batteryVoltage}V ${batteryAh}Ah`,
      inverter: `SHIL Backup / UPS ${inverterKw}kW ${systemVoltage}V`,
      expectedPvKw: 0,
      note: `طراحی برق اضطراری بدون پنل؛ محاسبه باتری با ${backupHours} ساعت زمان پشتیبانی انجام می‌شود.`
    },
    patch: {
      projectTitle: title,
      scenarioFamily: "backup",
      systemType: "backup",
      calculationMode: "loads",
      city: cityMeta.city,
      loadVoltage: 220,
      loadPower: demandPowerW,
      backupHours,
      daysAutonomy: 0,
      dailyEnergyKwh: backupEnergyKwh,
      dailyUsageHours: "",
      seasonProfile: "annual",
      seasonUsageFactor: 1,
      sunHours: 0,
      averageTemperature: cityMeta.temp,
      systemVoltage,
      batteryType: "LFP",
      batteryUnitVoltage: batteryVoltage,
      batteryUnitAh: batteryAh,
      backupParallelCount: "",
      batteryRoundTripEfficiency: 0.96,
      dod: 0.9,
      panelWatt: 0,
      panelVoc: 0,
      panelVmp: 0,
      inverterEfficiency: 0.95,
      inverterRatedPowerW: inverterKw * 1000,
      inverterAcPowerW: inverterKw * 1000,
      mpptCount: 0,
      maxPvVocV: 0,
      mpptMinVoltage: 0,
      mpptMaxVoltage: 0,
      targetOffsetPercent: 0,
      selectedEquipment: { panel: null, battery: null, inverter: null, controller: null },
      loadItems: buildBackupLoads(size, demandPowerW, backupHours, index)
    }
  };
}

function buildScenarioGroup(size, family) {
  const builder = family === "backup" ? buildBackupScenario : buildSolarScenario;
  return Array.from({ length: 100 }, (_, index) => builder(size, index + 1));
}

export const SOLAR_PROJECT_PRESETS = [
  ...buildScenarioGroup("light", "solar"),
  ...buildScenarioGroup("medium", "solar"),
  ...buildScenarioGroup("heavy", "solar"),
];

export const BACKUP_PROJECT_PRESETS = [
  ...buildScenarioGroup("light", "backup"),
  ...buildScenarioGroup("medium", "backup"),
  ...buildScenarioGroup("heavy", "backup"),
];

export const SMART_PROJECT_PRESETS = [
  ...SOLAR_PROJECT_PRESETS,
  ...BACKUP_PROJECT_PRESETS,
];

export function getSmartPresetsForSystem(systemType) {
  return SMART_PROJECT_PRESETS.filter((preset) => !systemType || preset.systemType === systemType);
}
