const domainMeta = {
  solar: {
    fa: "Ù¾Ø±ÙˆÚ˜Ù‡ Ù‡Ø§ÛŒ Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
    engine: "solar",
    baseLoadW: { light: 600, medium: 2200, heavy: 6500 },
    autonomyDays: { light: 1, medium: 1, heavy: 2 },
    backupHours: { light: 4, medium: 6, heavy: 10 },
  },
  emergency: {
    fa: "Ù¾Ø±ÙˆÚ˜Ù‡ Ù‡Ø§ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    engine: "emergency",
    baseLoadW: { light: 500, medium: 1800, heavy: 5000 },
    autonomyDays: { light: 1, medium: 2, heavy: 3 },
    backupHours: { light: 3, medium: 6, heavy: 12 },
  },
};

export const levelMeta = {
  light: { fa: "Ø³Ø¨Ú©", index: 1, factor: 1 },
  medium: { fa: "Ù…ØªÙˆØ³Ø·", index: 2, factor: 1.8 },
  heavy: { fa: "Ø³Ù†Ú¯ÛŒÙ†", index: 3, factor: 3.2 },
};

const levelOrder = ["light", "medium", "heavy"];
const domainOrder = ["solar", "emergency"];

function makeScenario(domain, level, serial) {
  const d = domainMeta[domain];
  const l = levelMeta[level];
  const loadEstimate = Math.round(d.baseLoadW[level] + serial * 35 * l.factor);
  const dailyEnergyWh = Math.round(loadEstimate * (domain === "solar" ? 4.8 : d.backupHours[level]));
  const suggestedPanels = domain === "solar" ? Math.max(2, Math.ceil(dailyEnergyWh / 2300)) : 0;
  const inverterRatedW = Math.ceil((loadEstimate * (domain === "emergency" ? 1.4 : 1.25)) / 500) * 500;
  const batteryAh = Math.ceil((dailyEnergyWh / 48 / 0.8) / 50) * 50;

  return {
    id: `${domain}-${level}-${String(serial).padStart(3, "0")}`,
    numericId: domainOrder.indexOf(domain) * 300 + levelOrder.indexOf(level) * 100 + serial,
    domain,
    levelKey: level,
    level: l.fa,
    category: d.fa,
    title: `${d.fa} - Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ ${l.fa} ${serial}`,
    description: `Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø¢Ù…Ø§Ø¯Ù‡ ${l.fa} Ø¨Ø±Ø§ÛŒ ${d.fa} Ø¨Ø§ ÙˆØ±ÙˆØ¯ÛŒ Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø¨Ø±Ø§ÛŒ Ø§ØªØµØ§Ù„ Ø¨Ù‡ Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒØŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§ØªÛŒ SHIL.`,
    loadEstimate,
    dailyEnergyWh,
    backupHours: d.backupHours[level],
    autonomyDays: d.autonomyDays[level],
    inverter: domain === "solar" ? "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" : "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    inverterRatedW,
    batteryType: domain === "solar" ? "Lithium / AGM" : "Lithium / AGM / Tubular",
    suggestedBattery: `48V ${batteryAh}Ah`,
    suggestedBatteryAh: batteryAh,
    suggestedPanels,
    calculationEngine: d.engine,
    defaultEnvironment: {
      peakSunHours: domain === "solar" ? 5 : 0,
      temperatureMinC: -5,
      temperatureMaxC: 45,
      altitude: 1200,
      humidity: 40,
    },
    requiredEquipment: {
      recommendedItems: domain === "solar"
        ? ["Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ", "ÛŒØ®Ú†Ø§Ù„", "Ù¾Ù…Ù¾", "Ù…ØµØ±Ù Ú©Ù†Ù†Ø¯Ù‡ Ø¹Ù…ÙˆÙ…ÛŒ"]
        : ["Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "ÛŒØ®Ú†Ø§Ù„", "Ù…ÙˆØ¯Ù…/Ø¯ÙˆØ±Ø¨ÛŒÙ†", "Ø¨Ø§Ø± Ø­ÛŒØ§ØªÛŒ"],
      loadW: loadEstimate,
      dailyWh: dailyEnergyWh,
    },
  };
}

export const scenarioLibrary = domainOrder.flatMap((domain) =>
  levelOrder.flatMap((level) =>
    Array.from({ length: 100 }, (_, index) => makeScenario(domain, level, index + 1))
  )
);

export function getScenarioList(domain, level) {
  return scenarioLibrary.filter((item) => {
    const domainOk = !domain || item.domain === domain;
    const levelOk = !level || item.levelKey === level || item.level === level || item.title.includes(level);
    return domainOk && levelOk;
  });
}

export function getScenarioById(id) {
  return scenarioLibrary.find((item) => item.id === id || item.numericId === Number(id));
}
