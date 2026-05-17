export const SHIL_SOLAR_PANELS = [
  { id: "pv-150", title: "پنل خورشیدی 150 وات", powerW: 150, vmp: 18.2, voc: 22.1, imp: 8.25, efficiency: 0.19, type: "Mono" },
  { id: "pv-250", title: "پنل خورشیدی 250 وات", powerW: 250, vmp: 30.5, voc: 37.4, imp: 8.2, efficiency: 0.195, type: "Mono" },
  { id: "pv-330", title: "پنل خورشیدی 330 وات", powerW: 330, vmp: 34.6, voc: 41.2, imp: 9.54, efficiency: 0.20, type: "Mono" },
  { id: "pv-450", title: "پنل خورشیدی 450 وات", powerW: 450, vmp: 41.1, voc: 49.2, imp: 10.95, efficiency: 0.205, type: "Mono PERC" },
  { id: "pv-550", title: "پنل خورشیدی 550 وات", powerW: 550, vmp: 41.8, voc: 49.8, imp: 13.16, efficiency: 0.21, type: "Mono PERC" },
  { id: "pv-600", title: "پنل خورشیدی 600 وات", powerW: 600, vmp: 42.1, voc: 50.2, imp: 14.25, efficiency: 0.215, type: "N-Type" },
  { id: "pv-700", title: "پنل خورشیدی 700 وات", powerW: 700, vmp: 42.9, voc: 51.4, imp: 16.32, efficiency: 0.22, type: "N-Type TOPCon" }
];

export const SHIL_SOLAR_INVERTERS = [
  { id: "inv-12-1000", title: "اینورتر خورشیدی 1kW / 12V", ratedPowerW: 1000, surgePowerW: 2000, dcVoltage: 12, mpptMinV: 60, mpptMaxV: 145, maxPvPowerW: 1400, parallelCapable: false },
  { id: "inv-12-2000", title: "اینورتر خورشیدی 2kW / 12V", ratedPowerW: 2000, surgePowerW: 4000, dcVoltage: 12, mpptMinV: 60, mpptMaxV: 145, maxPvPowerW: 2800, parallelCapable: false },
  { id: "inv-24-3000", title: "اینورتر خورشیدی 3kW / 24V", ratedPowerW: 3000, surgePowerW: 6000, dcVoltage: 24, mpptMinV: 80, mpptMaxV: 450, maxPvPowerW: 4200, parallelCapable: false },
  { id: "inv-24-5000", title: "اینورتر خورشیدی 5kW / 24V", ratedPowerW: 5000, surgePowerW: 10000, dcVoltage: 24, mpptMinV: 120, mpptMaxV: 450, maxPvPowerW: 6500, parallelCapable: true },
  { id: "inv-48-6000", title: "اینورتر خورشیدی 6kW / 48V", ratedPowerW: 6000, surgePowerW: 12000, dcVoltage: 48, mpptMinV: 120, mpptMaxV: 500, maxPvPowerW: 8000, parallelCapable: true },
  { id: "inv-48-8000", title: "اینورتر خورشیدی 8kW / 48V", ratedPowerW: 8000, surgePowerW: 16000, dcVoltage: 48, mpptMinV: 120, mpptMaxV: 500, maxPvPowerW: 11000, parallelCapable: true },
  { id: "inv-48-10000", title: "اینورتر خورشیدی 10kW / 48V", ratedPowerW: 10000, surgePowerW: 20000, dcVoltage: 48, mpptMinV: 150, mpptMaxV: 500, maxPvPowerW: 13000, parallelCapable: true },
  { id: "inv-48-15000", title: "اینورتر خورشیدی 15kW / 48V", ratedPowerW: 15000, surgePowerW: 30000, dcVoltage: 48, mpptMinV: 180, mpptMaxV: 600, maxPvPowerW: 19500, parallelCapable: true },
  { id: "inv-48-20000", title: "اینورتر خورشیدی 20kW / 48V", ratedPowerW: 20000, surgePowerW: 40000, dcVoltage: 48, mpptMinV: 180, mpptMaxV: 600, maxPvPowerW: 26000, parallelCapable: true },
  { id: "inv-48-30000", title: "اینورتر خورشیدی 30kW / 48V", ratedPowerW: 30000, surgePowerW: 60000, dcVoltage: 48, mpptMinV: 180, mpptMaxV: 850, maxPvPowerW: 39000, parallelCapable: true }
];

export const SHIL_LITHIUM_BATTERIES = [
  { id: "bat-12-100", title: "باتری لیتیوم 12V 100Ah", nominalVoltage: 12, minVoltage: 11, maxVoltage: 13, capacityAh: 100, usableDod: 0.85, efficiency: 0.94 },
  { id: "bat-12-200", title: "باتری لیتیوم 12V 200Ah", nominalVoltage: 12, minVoltage: 11, maxVoltage: 13, capacityAh: 200, usableDod: 0.85, efficiency: 0.94 },
  { id: "bat-24-100", title: "باتری لیتیوم 24V 100Ah", nominalVoltage: 24, minVoltage: 24, maxVoltage: 26, capacityAh: 100, usableDod: 0.85, efficiency: 0.94 },
  { id: "bat-24-200", title: "باتری لیتیوم 24V 200Ah", nominalVoltage: 24, minVoltage: 24, maxVoltage: 26, capacityAh: 200, usableDod: 0.85, efficiency: 0.94 },
  { id: "bat-48-100", title: "باتری لیتیوم 48V 100Ah", nominalVoltage: 48, minVoltage: 46, maxVoltage: 52, capacityAh: 100, usableDod: 0.85, efficiency: 0.94 },
  { id: "bat-48-200", title: "باتری لیتیوم 48V 200Ah", nominalVoltage: 48, minVoltage: 46, maxVoltage: 52, capacityAh: 200, usableDod: 0.85, efficiency: 0.94 }
];

export const SHIL_SOLAR_PROTECTION_BANK = {
  dc: ["فیوز DC رشته پنل", "کلید قطع DC", "سرج ارستر DC Type 2", "جعبه کامباینر DC"],
  ac: ["بریکر AC", "سرج ارستر AC Type 2", "کلید محافظ جان در صورت نیاز", "ارتینگ و همبندی"],
  battery: ["فیوز باتری", "کلید قطع باتری", "کابلشو و باس‌بار مناسب جریان", "BMS / حفاظت باتری"]
};
