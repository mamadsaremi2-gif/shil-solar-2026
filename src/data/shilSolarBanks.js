export const SHIL_SOLAR_PANELS = [
  { id: "shil-pv-400", title: "SHIL Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ 400 ÙˆØ§Øª", powerW: 400, vmp: 38.2, voc: 46.1, imp: 10.47, areaM2: 1.95, efficiency: 0.205, type: "Mono PERC" },
  { id: "shil-pv-450", title: "SHIL Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ 450 ÙˆØ§Øª", powerW: 450, vmp: 41.1, voc: 49.2, imp: 10.95, areaM2: 2.05, efficiency: 0.21, type: "Mono PERC" },
  { id: "shil-pv-550", title: "SHIL Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ 550 ÙˆØ§Øª", powerW: 550, vmp: 41.8, voc: 49.8, imp: 13.16, areaM2: 2.58, efficiency: 0.213, type: "Mono PERC" },
  { id: "shil-pv-620", title: "SHIL Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ 620 ÙˆØ§Øª", powerW: 620, vmp: 42.6, voc: 50.9, imp: 14.56, areaM2: 2.85, efficiency: 0.218, type: "N-Type" },
  { id: "shil-pv-700", title: "SHIL Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ 700 ÙˆØ§Øª", powerW: 700, vmp: 42.9, voc: 51.4, imp: 16.32, areaM2: 3.10, efficiency: 0.226, type: "N-Type TOPCon" }
];

const inv = (kw, v, mpptMin, mpptMax, maxPv, parallel = true) => ({
  id: `shil-inv-${v}-${String(kw).replace('.', '-')}`,
  title: `SHIL Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ ${kw} Ú©ÛŒÙ„ÙˆÙˆØ§Øª / ${v} ÙˆÙ„Øª`,
  ratedPowerW: Math.round(kw * 1000),
  surgePowerW: Math.round(kw * 1000 * 2),
  dcVoltage: v,
  batteryVoltage: v,
  batteryMinVoltage: v === 12 ? 11 : v === 24 ? 22 : 44,
  batteryMaxVoltage: v === 12 ? 13 : v === 24 ? 26 : 52,
  mpptMinV: mpptMin,
  mpptMaxV: mpptMax,
  maxPvPowerW: maxPv,
  parallelCapable: parallel
});

export const SHIL_SOLAR_INVERTERS = [
  inv(1.6, 12, 60, 145, 2200, false),
  inv(2, 12, 60, 145, 2800, false),
  inv(3, 24, 80, 450, 4200, false),
  inv(5, 24, 120, 450, 6500, true),
  inv(6, 48, 120, 500, 8000, true),
  inv(8, 48, 120, 500, 11000, true),
  inv(10, 48, 150, 500, 13000, true),
  inv(12, 48, 150, 550, 15600, true),
  inv(15, 48, 180, 600, 19500, true),
  inv(20, 48, 180, 600, 26000, true),
  inv(25, 48, 180, 850, 32500, true),
  inv(30, 48, 180, 850, 39000, true)
];

const battery = (v, ah) => ({
  id: `shil-bat-${v}-${ah}`,
  title: `SHIL Ø¨Ø§ØªØ±ÛŒ Ù„ÛŒØªÛŒÙˆÙ… ${v} ÙˆÙ„Øª ${ah} Ø¢Ù…Ù¾Ø± Ø³Ø§Ø¹Øª`,
  nominalVoltage: v,
  minVoltage: v === 12 ? 11 : v === 24 ? 22 : 44,
  maxVoltage: v === 12 ? 13 : v === 24 ? 26 : 52,
  capacityAh: ah,
  usableDod: 0.85,
  efficiency: 0.94,
  energyWh: v * ah
});

export const SHIL_LITHIUM_BATTERIES = [
  battery(12, 100),
  battery(24, 100), battery(24, 150), battery(24, 200), battery(24, 250), battery(24, 300),
  battery(48, 100), battery(48, 150), battery(48, 200), battery(48, 250), battery(48, 300)
];

export const SHIL_SOLAR_PROTECTION_BANK = {
  dc: ["ÙÛŒÙˆØ² DC Ø±Ø´ØªÙ‡ Ù¾Ù†Ù„", "Ú©Ù„ÛŒØ¯ Ù‚Ø·Ø¹ DC", "Ø³Ø±Ø¬ Ø§Ø±Ø³ØªØ± DC Type 2", "Ø¬Ø¹Ø¨Ù‡ Ú©Ø§Ù…Ø¨Ø§ÛŒÙ†Ø± DC"],
  ac: ["Ø¨Ø±ÛŒÚ©Ø± AC", "Ø³Ø±Ø¬ Ø§Ø±Ø³ØªØ± AC Type 2", "Ú©Ù„ÛŒØ¯ Ù…Ø­Ø§ÙØ¸ Ø¬Ø§Ù† Ø¯Ø± ØµÙˆØ±Øª Ù†ÛŒØ§Ø²", "Ø§Ø±ØªÛŒÙ†Ú¯ Ùˆ Ù‡Ù…Ø¨Ù†Ø¯ÛŒ"],
  battery: ["ÙÛŒÙˆØ² Ø¨Ø§ØªØ±ÛŒ", "Ú©Ù„ÛŒØ¯ Ù‚Ø·Ø¹ Ø¨Ø§ØªØ±ÛŒ", "Ú©Ø§Ø¨Ù„Ø´Ùˆ Ùˆ Ø¨Ø§Ø³â€ŒØ¨Ø§Ø± Ù…Ù†Ø§Ø³Ø¨ Ø¬Ø±ÛŒØ§Ù†", "BMS / Ø­ÙØ§Ø¸Øª Ø¨Ø§ØªØ±ÛŒ"]
};
