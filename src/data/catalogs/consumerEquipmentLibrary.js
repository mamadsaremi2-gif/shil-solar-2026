const categories = [
  "Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ", "Ø³Ø±Ù…Ø§ÛŒØ´", "Ú¯Ø±Ù…Ø§ÛŒØ´", "Ø¢Ø´Ù¾Ø²Ø®Ø§Ù†Ù‡", "Ø§Ø¯Ø§Ø±ÛŒ", "Ø´Ø¨Ú©Ù‡", "Ø§Ù…Ù†ÛŒØªÛŒ", "ØµÙ†Ø¹ØªÛŒ", "Ù¾Ù…Ù¾", "Ú©Ø´Ø§ÙˆØ±Ø²ÛŒ",
  "Ø¯Ø±Ù…Ø§Ù†ÛŒ", "ÙØ±ÙˆØ´Ú¯Ø§Ù‡ÛŒ", "Ú©Ø§Ø±Ú¯Ø§Ù‡ÛŒ", "Ù…Ø®Ø§Ø¨Ø±Ø§ØªÛŒ", "Ø¹Ù…ÙˆÙ…ÛŒ"
];

const baseItems = [
  ["Ù„Ø§Ù…Ù¾ LED", 12, 6, 1, "night", "light"], ["Ù¾Ù†Ù„ Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ LED", 45, 8, 1, "night", "light"], ["ÛŒØ®Ú†Ø§Ù„ Ø®Ø§Ù†Ú¯ÛŒ", 180, 12, 1.8, "mixed", "medium"],
  ["ÙØ±ÛŒØ²Ø±", 220, 12, 1.8, "mixed", "medium"], ["ØªÙ„ÙˆÛŒØ²ÛŒÙˆÙ† LED", 120, 5, 1.1, "evening", "light"], ["Ù…ÙˆØ¯Ù… Ø§ÛŒÙ†ØªØ±Ù†Øª", 15, 24, 1, "mixed", "light"],
  ["Ø±ÙˆØªØ± Ø´Ø¨Ú©Ù‡", 25, 24, 1, "mixed", "light"], ["Ù„Ù¾ ØªØ§Ù¾", 90, 6, 1, "day", "light"], ["Ú©Ø§Ù…Ù¾ÛŒÙˆØªØ± Ø§Ø¯Ø§Ø±ÛŒ", 250, 8, 1.2, "day", "medium"],
  ["Ù¾Ø±ÛŒÙ†ØªØ±", 500, 1, 1.5, "day", "medium"], ["Ø¯ÙˆØ±Ø¨ÛŒÙ† Ù…Ø¯Ø§Ø±Ø¨Ø³ØªÙ‡", 12, 24, 1, "mixed", "light"], ["NVR", 60, 24, 1.1, "mixed", "medium"],
  ["Ú©ÙˆÙ„Ø± Ø¢Ø¨ÛŒ", 650, 8, 2.2, "day", "medium"], ["Ú©ÙˆÙ„Ø± Ú¯Ø§Ø²ÛŒ 12000", 1200, 8, 3.2, "day", "heavy"], ["Ú©ÙˆÙ„Ø± Ú¯Ø§Ø²ÛŒ 24000", 2400, 8, 3.5, "day", "heavy"],
  ["ÙÙ† ØªÙ‡ÙˆÛŒÙ‡", 120, 10, 1.8, "day", "medium"], ["Ù‡ÛŒØªØ± Ø¨Ø±Ù‚ÛŒ", 2000, 4, 1.1, "night", "heavy"], ["Ù¾Ú©ÛŒØ¬/Ú©Ù†ØªØ±Ù„Ø± Ú¯Ø±Ù…Ø§ÛŒØ´", 180, 6, 1.4, "night", "medium"],
  ["Ù…Ø§ÛŒÚ©Ø±ÙˆÙˆÛŒÙˆ", 1200, 0.5, 1.2, "noon", "heavy"], ["Ú†Ø§ÛŒ Ø³Ø§Ø²", 1800, 0.7, 1.1, "morning", "heavy"], ["Ù…Ø§Ø´ÛŒÙ† Ù„Ø¨Ø§Ø³Ø´ÙˆÛŒÛŒ", 900, 1.5, 2.5, "day", "heavy"],
  ["Ù¾Ù…Ù¾ Ø¢Ø¨ Ù†ÛŒÙ… Ø§Ø³Ø¨", 370, 2, 3.2, "mixed", "medium"], ["Ù¾Ù…Ù¾ Ø¢Ø¨ ÛŒÚ© Ø§Ø³Ø¨", 750, 2, 3.5, "mixed", "heavy"], ["Ù¾Ù…Ù¾ Ú©ÙÚ©Ø´", 1100, 3, 3.5, "day", "heavy"],
  ["ÛŒØ®Ú†Ø§Ù„ ÙØ±ÙˆØ´Ú¯Ø§Ù‡ÛŒ", 450, 16, 2.3, "mixed", "heavy"], ["Ú©Ø±Ú©Ø±Ù‡ Ø¨Ø±Ù‚ÛŒ", 450, 0.3, 2.8, "day", "medium"], ["Ø¯Ø±Ø¨ Ø§ØªÙˆÙ…Ø§ØªÛŒÚ©", 350, 0.5, 2.2, "day", "medium"],
  ["Ø³Ø±ÙˆØ± Ø±Ú©", 600, 24, 1.2, "mixed", "heavy"], ["Ø³ÛŒØ³ØªÙ… Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø´Ø¨Ú©Ù‡", 300, 24, 1.1, "mixed", "medium"], ["Ø¯Ø³ØªÚ¯Ø§Ù‡ POS", 18, 12, 1, "day", "light"],
  ["Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", 30, 8, 1, "night", "light"], ["Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø¬ÙˆØ´ Ø³Ø¨Ú©", 3500, 1, 2, "day", "heavy"], ["Ú©Ù…Ù¾Ø±Ø³ÙˆØ± Ù‡ÙˆØ§", 2200, 2, 3.5, "day", "heavy"],
  ["Ø¯Ø±ÛŒÙ„ Ø¨Ø±Ù‚ÛŒ", 700, 1, 1.8, "day", "medium"], ["ÙØ±Ø² Ø³Ù†Ú¯Ø¨Ø±ÛŒ", 1800, 1, 2.1, "day", "heavy"], ["ØªØ±Ø§Ø²ÙˆÛŒ Ø¯ÛŒØ¬ÛŒØªØ§Ù„", 25, 10, 1, "day", "light"],
  ["Ø¯Ø³ØªÚ¯Ø§Ù‡ Ú©Ø§Ø±ØªØ®ÙˆØ§Ù†", 12, 10, 1, "day", "light"], ["ÛŒØ®Ú†Ø§Ù„ Ø¯Ø§Ø±ÙˆÛŒÛŒ", 250, 24, 1.8, "mixed", "heavy"], ["Ø§Ú©Ø³ÛŒÚ˜Ù† Ø³Ø§Ø²", 450, 8, 1.5, "mixed", "heavy"],
  ["Ù…Ø§Ù†ÛŒØªÙˆØ±", 40, 8, 1, "day", "light"], ["Ø§Ø³Ù¾ÛŒÚ©Ø±/Ø¢Ù…Ù¾Ù„ÛŒâ€ŒÙØ§ÛŒØ±", 250, 3, 1.5, "evening", "medium"], ["Ø¢Ø¨Ú¯Ø±Ù…Ú©Ù† Ø¨Ø±Ù‚ÛŒ", 2500, 2, 1.1, "morning", "heavy"],
  ["Ù…Ø§Ø´ÛŒÙ† Ø¸Ø±ÙØ´ÙˆÛŒÛŒ", 1500, 1.5, 1.8, "night", "heavy"], ["Ø¬Ø§Ø±ÙˆØ¨Ø±Ù‚ÛŒ", 1600, 0.5, 1.5, "day", "heavy"], ["Ø´Ø§Ø±Ú˜Ø± Ù…ÙˆØ¨Ø§ÛŒÙ„", 20, 4, 1, "evening", "light"],
  ["Ø´Ø§Ø±Ú˜Ø± Ø§Ø¨Ø²Ø§Ø±", 180, 2, 1.2, "day", "light"], ["Ø±ÙˆØ´Ù†Ø§ÛŒÛŒ Ù…Ø­ÙˆØ·Ù‡", 80, 10, 1, "night", "medium"], ["ØªØ§Ø¨Ù„Ùˆ ÙØ±Ù…Ø§Ù†", 120, 24, 1.2, "mixed", "medium"],
  ["Ø³Ù†Ø³ÙˆØ± Ùˆ Ú©Ù†ØªØ±Ù„Ø±", 20, 24, 1, "mixed", "light"], ["Ø³ÛŒØ³ØªÙ… Ø§Ø¹Ù„Ø§Ù… Ø­Ø±ÛŒÙ‚", 50, 24, 1, "mixed", "medium"], ["Ø¯Ø³ØªÚ¯Ø§Ù‡ ØªØµÙÛŒÙ‡ Ø¢Ø¨", 90, 4, 1.6, "day", "medium"]
];

export const consumerEquipmentLibrary = Array.from({ length: 250 }, (_, i) => {
  const base = baseItems[i % baseItems.length];
  const group = Math.floor(i / baseItems.length) + 1;
  const powerScale = [1, 1.15, 1.3, 0.85, 1.5][group % 5];
  const hoursScale = [1, 0.75, 1.25, 0.5, 1.5][group % 5];
  const ratedPowerW = Math.round(base[1] * powerScale);
  const usageHoursPerDay = Number(Math.min(24, Math.max(0.2, base[2] * hoursScale)).toFixed(1));
  const diversityFactor = base[5] === "heavy" ? 0.75 : base[5] === "medium" ? 0.85 : 0.95;
  const energyDailyWh = Math.round(ratedPowerW * usageHoursPerDay * diversityFactor);
  return {
    id: `eq-${String(i + 1).padStart(3, "0")}`,
    title: `${base[0]} ${group > 1 ? `Ù…Ø¯Ù„ ${group}` : ""}`.trim(),
    category: categories[i % categories.length],
    class: base[5],
    ratedPowerW,
    defaultPowerW: ratedPowerW,
    usageHoursPerDay,
    diversityFactor,
    simultaneityFactor: diversityFactor,
    powerFactor: base[3] > 1.7 ? 0.82 : base[5] === "heavy" ? 0.88 : 0.95,
    startupFactor: base[3],
    surgeFactor: base[3],
    motorStartCurrentFactor: base[3] > 1.7 ? 2.5 : 1,
    softStarterFactor: base[3] > 1.7 ? 1.2 : 1,
    hasSoftStarter: false,
    energyDailyWh,
    energyDailyKWh: Number((energyDailyWh / 1000).toFixed(2)),
    voltage: i % 17 === 0 ? 380 : 220,
    phase: i % 17 === 0 ? "three" : "single",
    type: base[3] > 1.7 ? "inductive" : "resistive/electronic",
    profile: base[4],
    priority: ["Ø­ÛŒØ§ØªÛŒ", "Ù…Ù‡Ù…", "Ø¹Ø§Ø¯ÛŒ", "Ù‚Ø§Ø¨Ù„ Ø­Ø°Ù"][i % 4],
  };
});

export function searchConsumerEquipment(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return consumerEquipmentLibrary;
  return consumerEquipmentLibrary.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.priority.toLowerCase().includes(q) ||
    item.class.toLowerCase().includes(q)
  );
}
