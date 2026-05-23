export const SHIL_SOLAR_PANELS = [
  {
    id: "shil-pv-430-perc",
    brand: "SHIL",
    title: "SHIL 400-460W PERC",
    model: "SHIL 400-460W",
    powerW: 430,
    powerRangeW: [400, 460],
    vmp: 40.5,
    vmpRangeV: [40, 41],
    voc: 49,
    vocRangeV: [48, 50],
    imp: 10.75,
    impRangeA: [10.5, 11],
    isc: 11.5,
    iscRangeA: [11.5, 11.5],
    dimensions: "1.7×1.0m",
    widthM: 1.0,
    lengthM: 1.7,
    areaM2: 1.7,
    efficiency: 0.205,
    technology: "PERC",
    type: "Mono PERC",
    maxSystemVoltageV: 1500,
    tempCoeffVocPctC: -0.28,
    useCase: "مسکونی / UPS خورشیدی / پروژه‌های سبک"
  },
  {
    id: "shil-pv-550-perc",
    brand: "SHIL",
    title: "SHIL 530-560W PERC",
    model: "SHIL 530-560W",
    powerW: 550,
    powerRangeW: [530, 560],
    vmp: 42,
    vmpRangeV: [41, 43],
    voc: 50.5,
    vocRangeV: [49, 52],
    imp: 12.8,
    impRangeA: [12.5, 13],
    isc: 13,
    iscRangeA: [13, 13],
    dimensions: "2.2×1.1m",
    widthM: 1.1,
    lengthM: 2.2,
    areaM2: 2.42,
    efficiency: 0.213,
    technology: "PERC",
    type: "Mono PERC",
    maxSystemVoltageV: 1500,
    tempCoeffVocPctC: -0.28,
    useCase: "پروژه‌های خانگی بزرگ / تجاری سبک"
  },
  {
    id: "shil-pv-700-topcon",
    brand: "SHIL",
    title: "SHIL 600-715W TOPCon",
    model: "SHIL 600-715W",
    powerW: 700,
    powerRangeW: [600, 715],
    vmp: 44,
    vmpRangeV: [43, 45],
    voc: 53,
    vocRangeV: [52, 54],
    imp: 16,
    impRangeA: [15.5, 16.5],
    isc: 17.5,
    iscRangeA: [17, 18],
    dimensions: "2.38×1.3m",
    widthM: 1.3,
    lengthM: 2.38,
    areaM2: 3.094,
    efficiency: 0.226,
    technology: "TOPCon",
    type: "N-Type TOPCon",
    maxSystemVoltageV: 1500,
    tempCoeffVocPctC: -0.25,
    useCase: "تجاری / صنعتی / نیروگاهی"
  }
];

const inverter = (cfg) => ({
  brand: "SHIL",
  waveform: "Pure Sine Wave",
  batterySupported: ["Lead Acid", "Lithium", "LiFePO4"],
  communication: ["CAN", "RS485", "RS232", "WiFi"],
  efficiency: 0.93,
  maxDcVoltage: cfg.maxPvVocV || 500,
  maxPvVoc: cfg.maxPvVocV || 500,
  mpptCount: cfg.mpptCount || 1,
  outputVoltage: cfg.outputVoltage || 230,
  outputFrequency: 50,
  parallelCapable: Boolean(cfg.parallelCapable),
  ...cfg,
  id: cfg.id || `shil-${cfg.series}-${String(cfg.ratedPowerW).replace(/\D/g, "")}-${cfg.batteryVoltage}v`,
  title: cfg.title || `SHIL ${cfg.series} ${Math.round(cfg.ratedPowerW / 1000)}KW ${cfg.batteryVoltage}V`,
  dcVoltage: cfg.batteryVoltage,
  batteryMinVoltage: cfg.batteryMinVoltage ?? (cfg.batteryVoltage === 12 ? 11 : cfg.batteryVoltage === 24 ? 21.6 : 43.2),
  batteryMaxVoltage: cfg.batteryMaxVoltage ?? (cfg.batteryVoltage === 12 ? 13 : cfg.batteryVoltage === 24 ? 29.2 : 58.4),
  surgePowerW: cfg.surgePowerW || cfg.ratedPowerW * 2,
  maxPvPowerW: cfg.maxPvPowerW || Math.round(cfg.ratedPowerW * 1.3),
});

export const SHIL_SOLAR_INVERTERS = [
  inverter({ id: "shil-si-1-6kw-12v", series: "SI", model: "SI 1.6KW", type: "Off Grid", title: "SHIL SI 1.6KW 12V", ratedPowerW: 1600, batteryVoltage: 12, batteryMinVoltage: 11, batteryMaxVoltage: 13, mpptMinV: 30, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 2200, maxPvInputCurrentA: 18, parallelCapable: false, note: "طبق اصلاح نهایی: بانک باتری 12V با بازه 11 تا 13 ولت." }),
  inverter({ id: "shil-si-3-2kw-24v", series: "SI", model: "SI 3.2KW", type: "Off Grid", title: "SHIL SI 3.2KW 24V", ratedPowerW: 3200, batteryVoltage: 24, mpptMinV: 30, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 4200, maxPvInputCurrentA: 22, parallelCapable: false }),
  inverter({ id: "shil-si-4kw-24v", series: "SI", model: "SI 4KW", type: "Off Grid", title: "SHIL SI 4KW 24V", ratedPowerW: 4000, batteryVoltage: 24, mpptMinV: 60, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 5200, maxPvInputCurrentA: 27, parallelCapable: false }),
  inverter({ id: "shil-si-6kw-48v", series: "SI", model: "SI 6KW", type: "Off Grid", title: "SHIL SI 6KW 48V", ratedPowerW: 6000, batteryVoltage: 48, mpptMinV: 60, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 8000, maxPvInputCurrentA: 27, parallelCapable: true }),
  inverter({ id: "shil-hi-4kw-48v", series: "HI", model: "HI 4KW", type: "Hybrid", title: "SHIL HI 4KW 48V Hybrid All In One", ratedPowerW: 4000, batteryVoltage: 48, mpptMinV: 60, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 5200, maxPvInputCurrentA: 27, mpptCount: 1, parallelCapable: true }),
  inverter({ id: "shil-hi-6kw-48v", series: "HI", model: "HI 6KW", type: "Hybrid", title: "SHIL HI 6KW 48V Hybrid All In One", ratedPowerW: 6000, batteryVoltage: 48, mpptMinV: 60, mpptMaxV: 450, maxPvVocV: 500, maxPvPowerW: 8000, maxPvInputCurrentA: 27, mpptCount: 1, parallelCapable: true }),
  inverter({ id: "shil-hi2-8kw-48v", series: "HI2", model: "HI2 8KW", type: "Hybrid", title: "SHIL HI2 8KW 48V", ratedPowerW: 8000, batteryVoltage: 48, mpptMinV: 120, mpptMaxV: 500, maxPvVocV: 500, maxPvPowerW: 11000, maxPvInputCurrentA: 30, mpptCount: 2, parallelCapable: true }),
  inverter({ id: "shil-hi2-11kw-48v", series: "HI2", model: "HI2 11KW", type: "Hybrid", title: "SHIL HI2 11KW 48V", ratedPowerW: 11000, batteryVoltage: 48, mpptMinV: 120, mpptMaxV: 500, maxPvVocV: 500, maxPvPowerW: 14500, maxPvInputCurrentA: 32, mpptCount: 2, parallelCapable: true }),
  inverter({ id: "shil-utility-30kw-600v", series: "UTILITY", model: "UTILITY 30KW", type: "On Grid", title: "SHIL Utility 30KW String Inverter", ratedPowerW: 30000, batteryVoltage: 48, mpptMinV: 180, mpptMaxV: 850, maxPvVocV: 1000, maxPvPowerW: 39000, maxPvInputCurrentA: 40, mpptCount: 3, parallelCapable: true, outputVoltage: 400 })
];

const lithiumBattery = (cfg) => ({
  brand: "SHIL",
  series: "LiFePO4 Standing Battery Pack",
  chemistry: "LiFePO4",
  bms: true,
  cycleLife: 6000,
  usableDod: 0.9,
  efficiency: 0.94,
  maxChargeCurrentA: 100,
  recommendedChargeCurrentA: 50,
  maxDischargeCurrentA: cfg.maxDischargeCurrentA || 100,
  optionalDischargeCurrentA: 200,
  parallelSupport: 8,
  communication: ["CAN", "RS485", "RS232"],
  ipRating: "IP20",
  ...cfg,
  id: cfg.id || `shil-lfp-${String(cfg.nominalVoltage).replace(".", "-")}-${cfg.capacityAh}`,
  title: cfg.title || `SHIL LiFePO4 ${cfg.nominalVoltage}V ${cfg.capacityAh}Ah`,
  energyWh: Math.round(cfg.nominalVoltage * cfg.capacityAh),
  minVoltage: cfg.minVoltage ?? (cfg.nominalVoltage === 12 ? 11 : cfg.nominalVoltage === 25.6 ? 21.6 : 43.2),
  maxVoltage: cfg.maxVoltage ?? (cfg.nominalVoltage === 12 ? 13 : cfg.nominalVoltage === 25.6 ? 29.2 : 58.4)
});

export const SHIL_LITHIUM_BATTERIES = [
  lithiumBattery({ id: "shil-lfp-12-100", title: "SHIL LiFePO4 12V 100Ah", nominalVoltage: 12, capacityAh: 100, minVoltage: 11, maxVoltage: 13, maxDischargeCurrentA: 100, note: "برای SI 1.6KW و سیستم‌های 12V سبک" }),
  lithiumBattery({ nominalVoltage: 25.6, capacityAh: 100 }),
  lithiumBattery({ nominalVoltage: 25.6, capacityAh: 200 }),
  lithiumBattery({ nominalVoltage: 51.2, capacityAh: 100 }),
  lithiumBattery({ nominalVoltage: 51.2, capacityAh: 150 }),
  lithiumBattery({ nominalVoltage: 51.2, capacityAh: 200, maxDischargeCurrentA: 200 }),
  lithiumBattery({ nominalVoltage: 51.2, capacityAh: 300, maxDischargeCurrentA: 200 })
];

export const SHIL_SOLAR_PROTECTION_BANK = {
  dc: ["فیوز DC رشته پنل", "کلید قطع DC", "سرج ارستر DC Type 2", "جعبه کامباینر DC", "کانکتور MC4 استاندارد"],
  ac: ["بریکر AC", "سرج ارستر AC Type 2", "کلید محافظ جان در صورت نیاز", "ارتینگ و همبندی", "تابلو خروجی AC"],
  battery: ["فیوز باتری", "کلید قطع باتری", "کابلشو و باس‌بار مناسب جریان", "BMS / حفاظت باتری", "رک یا استند تهویه‌دار"]
};

export const SHIL_CABLE_BANK = [
  { id: "pv-6", title: "کابل PV 6mm²", currentA: 45, side: "PV/DC" },
  { id: "pv-10", title: "کابل PV 10mm²", currentA: 65, side: "PV/DC" },
  { id: "dc-25", title: "کابل DC 25mm²", currentA: 110, side: "Battery/DC" },
  { id: "dc-50", title: "کابل DC 50mm²", currentA: 170, side: "Battery/DC" },
  { id: "ac-10", title: "کابل AC 10mm²", currentA: 55, side: "AC" },
  { id: "ac-16", title: "کابل AC 16mm²", currentA: 75, side: "AC" },
  { id: "ac-35", title: "کابل AC 35mm²", currentA: 130, side: "AC" }
];
