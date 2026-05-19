export const SHIL_AI_LAYER_VERSION = "AI-INSTALLATION-PREVIEW-v2.0";

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value, fallback = "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

const INSTALL_MODE_META = {
  roof: { title: "Ù†ØµØ¨ Ø±ÙˆÛŒ Ø³Ù‚Ù", scene: "rooftop solar installation", surface: "roof plane" },
  ground: { title: "Ù†ØµØ¨ Ø²Ù…ÛŒÙ†ÛŒ", scene: "ground mount solar installation", surface: "ground mounted structure" },
  hybrid: { title: "Ù†ØµØ¨ ØªØ±Ú©ÛŒØ¨ÛŒ", scene: "hybrid roof and ground solar installation", surface: "mixed roof and ground" },
  equipmentRoom: { title: "Ø§ØªØ§Ù‚ Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø§ÛŒÙ†ÙˆØ±ØªØ±", scene: "electrical and battery room layout", surface: "equipment room" },
};

export function buildInstallationPreviewPrompt({ installMode = "roof", siteImageTitle, panel, inverter, battery, project, environment } = {}) {
  const meta = INSTALL_MODE_META[installMode] || INSTALL_MODE_META.roof;
  const panelCount = safeNumber(panel?.count, 0);
  const panelPowerW = safeNumber(panel?.powerW, 620);
  const series = text(panel?.series, "-");
  const parallel = text(panel?.parallel, "-");
  const inverterPower = text(inverter?.powerW, "-");
  const batteryCount = text(battery?.count, "-");
  const city = text(environment?.city || project?.city, "Ù…Ø­Ù„ Ù¾Ø±ÙˆÚ˜Ù‡");

  return [
    "Create a realistic industrial engineering visualization for a solar installation preview.",
    `Scene type: ${meta.scene}.`,
    `Use the provided project site photo as the base reference: ${siteImageTitle || "site image"}.`,
    `Location context: ${city}.`,
    `Show ${panelCount || "calculated"} solar panels rated ${panelPowerW}W each, arranged as ${series} series by ${parallel} parallel strings.`,
    `Show inverter placement with rated power ${inverterPower}W and a clean technical cable route.`,
    `Show battery bank zone with ${batteryCount} batteries only if the design requires batteries.`,
    "Keep the output realistic, clean, engineering-grade, not cartoonish, not decorative, no prices, no marketing text.",
    "Use subtle technical overlays, minimal labels, and preserve the real site perspective."
  ].join("\n");
}

function buildPanelRows(panel = {}) {
  return [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„", value: `${text(panel.count)} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø± Ø§Ø³Ø§Ø³ ØªÙˆØ§Ù† Ùˆ Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯Ù†ÛŒØ§Ø² Ù¾Ø±ÙˆÚ˜Ù‡ Ùˆ Ø®Ø±ÙˆØ¬ÛŒ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª ØªØ¹ÛŒÛŒÙ† Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ØªÙˆØ§Ù† Ù‡Ø± Ù¾Ù†Ù„", value: `${text(panel.powerW, 620)} ÙˆØ§Øª`, reason: "ØªÙˆØ§Ù† Ù…Ø¨Ù†Ø§ Ø¨Ø±Ø§ÛŒ Ø·Ø±Ø§Ø­ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø¢Ø±Ø§ÛŒÙ‡ Ù¾Ù†Ù„ Ø§Ø³Øª Ùˆ Ø¯Ø± ØµÙˆØ±Øª ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ Ú©Ø§Ø±Ø¨Ø± Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ø³Ø±ÛŒ", value: `${text(panel.series)} Ø³Ø±ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ù‚Ø±Ø§Ø± Ú¯Ø±ÙØªÙ† ÙˆÙ„ØªØ§Ú˜ Ø±Ø´ØªÙ‡ Ø¯Ø± Ù…Ø­Ø¯ÙˆØ¯Ù‡ Ù…Ø¬Ø§Ø² MPPT Ø§Ù†ØªØ®Ø§Ø¨ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ù…ÙˆØ§Ø²ÛŒ", value: `${text(panel.parallel)} Ù…ÙˆØ§Ø²ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ Ø¸Ø±ÙÛŒØª Ú©Ù„ Ø¢Ø±Ø§ÛŒÙ‡ Ùˆ Ú©Ù†ØªØ±Ù„ Ø¬Ø±ÛŒØ§Ù† Ø±Ø´ØªÙ‡â€ŒÙ‡Ø§ ØªØ¹ÛŒÛŒÙ† Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
  ];
}

function buildInverterRows(inverter = {}) {
  return [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ±", value: `${text(inverter.count)} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø± Ø§Ø³Ø§Ø³ ØªÙˆØ§Ù† Ù¾ÛŒÚ©ØŒ Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø·Ø±Ø§Ø­ÛŒ Ùˆ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ØªÙˆØ§Ù† Ø§ÛŒÙ†ÙˆØ±ØªØ±", value: inverter.powerW === "-" ? "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡" : `${text(inverter.powerW)} ÙˆØ§Øª`, reason: "Ø¨Ø±Ø§ÛŒ Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ù‡Ù…Ø²Ù…Ø§Ù† Ùˆ Ø¸Ø±ÙÛŒØª Ø±Ø²Ø±Ùˆ ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡ Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
    { label: "Ù†ÙˆØ¹ Ø§Ù†ØªØ®Ø§Ø¨", value: text(inverter.title, "Ø§Ù†ØªØ®Ø§Ø¨ Ù‡ÙˆØ´Ù…Ù†Ø¯"), reason: "Ø§Ø² Ø¨Ø§Ù†Ú© Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ù…ØªÙ†Ø§Ø³Ø¨ Ø¨Ø§ Ù…Ø³ÛŒØ± Ø¢ÙÚ¯Ø±ÛŒØ¯ØŒ Ø¢Ù†Ú¯Ø±ÛŒØ¯ ÛŒØ§ Ù‡ÛŒØ¨Ø±ÛŒØ¯ Ø§Ù†ØªØ®Ø§Ø¨ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
  ];
}

function buildBatteryRows(battery = {}) {
  return [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ØªØ±ÛŒ", value: `${text(battery.count)} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø±Ø§ÛŒ ØªØ§Ù…ÛŒÙ† Ø°Ø®ÛŒØ±Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ùˆ Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ÙˆÙ„ØªØ§Ú˜ / Ø¸Ø±ÙÛŒØª", value: `${text(battery.voltageV)}V / ${text(battery.capacityAh)}Ah`, reason: "Ø¨Ø±Ø§ÛŒ Ø³Ø§Ø²Ú¯Ø§Ø±ÛŒ Ø¨Ø§ Ø¨Ø§Ø³ DC Ùˆ Ø¸Ø±ÙÛŒØª Ø°Ø®ÛŒØ±Ù‡ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ø³Ø±ÛŒ", value: `${text(battery.series)} Ø³Ø±ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ ÙˆÙ„ØªØ§Ú˜ Ú©Ø§Ø±ÛŒ Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ ØªØ¹ÛŒÛŒÙ† Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ù…ÙˆØ§Ø²ÛŒ", value: `${text(battery.parallel)} Ù…ÙˆØ§Ø²ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø§ÙØ²Ø§ÛŒØ´ Ø¸Ø±ÙÛŒØª Ah Ùˆ Ù¾Ø§ÛŒØ¯Ø§Ø±ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
  ];
}

export function createAIInstallationPreview({ installMode = "roof", image, panel, inverter, battery, project, environment } = {}) {
  const meta = INSTALL_MODE_META[installMode] || INSTALL_MODE_META.roof;
  const panelCount = safeNumber(panel?.count, 0);
  const confidence = Math.max(78, Math.min(96, 84 + Math.min(panelCount, 16) * 0.6 + (image?.src ? 4 : 0)));
  const prompt = buildInstallationPreviewPrompt({ installMode, siteImageTitle: image?.title, panel, inverter, battery, project, environment });

  return {
    version: SHIL_AI_LAYER_VERSION,
    createdAt: new Date().toISOString(),
    mode: "optional-ai-installation-visualization",
    status: "ready",
    installMode,
    installModeTitle: meta.title,
    image,
    prompt,
    confidence: Math.round(confidence),
    visualSpec: {
      surface: meta.surface,
      perspective: "preserve-site-perspective",
      overlayStyle: "industrial-minimal",
      maxVisiblePanels: Math.min(panelCount || 8, 18),
      labels: ["PV ARRAY", "INVERTER", "BATTERY BANK", "DC/AC PROTECTION"],
    },
    panel,
    inverter,
    battery,
    tables: {
      panel: buildPanelRows(panel),
      inverter: buildInverterRows(inverter),
      battery: buildBatteryRows(battery),
    },
    qualityChecks: [
      { title: "Ù‡Ù…Ø®ÙˆØ§Ù†ÛŒ Ø¨Ø§ ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨", status: image?.src ? "Ø¢Ù…Ø§Ø¯Ù‡" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ ØªØµÙˆÛŒØ±", note: "ØªØµÙˆÛŒØ± Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† Ù…Ø±Ø¬Ø¹ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
      { title: "Ù‡Ù…Ø®ÙˆØ§Ù†ÛŒ Ø¨Ø§ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª", status: "Ø¢Ù…Ø§Ø¯Ù‡", note: "ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„ØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø¨Ø§ØªØ±ÛŒ Ø§Ø² Ø®Ø±ÙˆØ¬ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø®ÙˆØ§Ù†Ø¯Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
      { title: "Ù‚Ø§Ø¨Ù„ÛŒØª Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø¯Ø± Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ", status: "Ø¢Ù…Ø§Ø¯Ù‡", note: "Ù†ØªÛŒØ¬Ù‡ Ø¯Ø± ØµÙØ­Ù‡ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒØŒ Ø°Ø®ÛŒØ±Ù‡ ØªØµÙˆÛŒØ± Ùˆ PDF Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
    ],
    engineeringNote: "Ø§ÛŒÙ† Ø®Ø±ÙˆØ¬ÛŒ ÛŒÚ© Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ ØªØµÙˆÛŒØ±ÛŒ Ø§Ø®ØªÛŒØ§Ø±ÛŒ Ø¨Ø±Ø§ÛŒ Ù†Ù…Ø§ÛŒØ´ Ù…Ø­Ù„ Ù†ØµØ¨ Ø¢ÛŒÙ†Ø¯Ù‡ Ø§Ø³Øª Ùˆ Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† Ø¨Ø§Ø²Ø¯ÛŒØ¯ Ø§Ø¬Ø±Ø§ÛŒÛŒØŒ Ø¨Ø±Ø¯Ø§Ø´Øª Ø§Ø¨Ø¹Ø§Ø¯ØŒ Ø³Ø§Ø²Ù‡ Ùˆ ØªØ£ÛŒÛŒØ¯ Ù†Ù‡Ø§ÛŒÛŒ Ù†ØµØ§Ø¨ Ù†ÛŒØ³Øª.",
  };
}
