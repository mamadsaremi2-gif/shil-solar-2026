export const METHOD_LABELS = {
  equipment: "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª",
  profile: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…ØµØ±Ù",
  energy: "Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²",
  power: "ØªÙˆØ§Ù† Ú©Ù„",
  current: "Ø¬Ø±ÛŒØ§Ù† Ú©Ù„",
};

function round(value, digits = 2) {
  const n = Number(value || 0);
  return Number(n.toFixed(digits));
}

function detectMotorLoad(item = {}) {
  return item.isMotor === true ||
    item.type === "inductive" ||
    Number(item.startupFactor || item.surgeFactor || 1) > 1.7 ||
    /Ù¾Ù…Ù¾|Ù…ÙˆØªÙˆØ±|Ú©Ù…Ù¾Ø±Ø³ÙˆØ±|Ú©ÙˆÙ„Ø±|ÙÙ†|Ø¯Ø±Ø¨|Ú©Ø±Ú©Ø±Ù‡|Ú†ÛŒÙ„Ø±/i.test(String(item.title || ""));
}

export function normalizeLoadItem(item = {}) {
  const quantity = Number(item.quantity ?? 1) || 1;
  const ratedPowerW = Number(item.ratedPowerW ?? item.defaultPowerW ?? 0) || 0;
  const usageHoursPerDay = Number(item.usageHoursPerDay ?? item.defaultHours ?? 0) || 0;
  const simultaneityFactor = Number(item.simultaneityFactor ?? item.diversityFactor ?? 1) || 1;
  const diversityFactor = simultaneityFactor;
  const powerFactor = Number(item.powerFactor ?? (detectMotorLoad(item) ? 0.82 : 0.95)) || 0.95;
  const voltage = Number(item.voltage ?? 220) || 220;
  const phase = item.phase || (voltage >= 380 ? "three" : "single");
  const isMotor = detectMotorLoad(item);
  const hasSoftStarter = Boolean(item.hasSoftStarter);
  const motorStartCurrentFactor = isMotor ? Number(item.motorStartCurrentFactor ?? 2.5) || 2.5 : 1;
  const softStarterFactor = isMotor ? Number(item.softStarterFactor ?? 1.2) || 1.2 : 1;
  const currentStartFactor = isMotor ? (hasSoftStarter ? softStarterFactor : motorStartCurrentFactor) : 1;
  const surgeFactor = Number(item.surgeFactor ?? item.startupFactor ?? currentStartFactor ?? 1) || 1;

  const nominalCurrentA = phase === "three"
    ? ratedPowerW / (Math.sqrt(3) * voltage * powerFactor)
    : ratedPowerW / (voltage * powerFactor);
  const effectivePowerW = Math.round(ratedPowerW * quantity * simultaneityFactor);
  const dailyEnergyWh = Math.round(ratedPowerW * quantity * usageHoursPerDay * simultaneityFactor);
  const runningCurrentA = nominalCurrentA * quantity * simultaneityFactor;
  const startCurrentA = nominalCurrentA * quantity * currentStartFactor;
  const surgePowerW = Math.round(voltage * startCurrentA * powerFactor * (phase === "three" ? Math.sqrt(3) : 1));

  return {
    ...item,
    quantity,
    ratedPowerW,
    usageHoursPerDay,
    simultaneityFactor,
    diversityFactor,
    powerFactor,
    voltage,
    phase,
    isMotor,
    hasSoftStarter,
    motorStartCurrentFactor,
    softStarterFactor,
    currentStartFactor,
    surgeFactor,
    effectivePowerW,
    dailyEnergyWh,
    dailyEnergyKWh: round(dailyEnergyWh / 1000, 2),
    nominalCurrentA: round(nominalCurrentA, 2),
    runningCurrentA: round(runningCurrentA, 2),
    startCurrentA: round(startCurrentA, 2),
    surgePowerW,
    currentA: round(runningCurrentA, 2),
    expertReason: isMotor
      ? `Ø¨Ø§Ø± Ù…ÙˆØªÙˆØ±ÛŒØ› Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ ${hasSoftStarter ? "Ø¨Ø§ Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ±" : "Ø¨Ø¯ÙˆÙ† Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ±"} Ø¨Ø±Ø§Ø¨Ø± ${currentStartFactor} Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ Ù„Ø­Ø§Ø¸ Ø´Ø¯.`
      : `Ø¨Ø§Ø± ØºÛŒØ±Ù…ÙˆØªÙˆØ±ÛŒØ› Ø¶Ø±ÛŒØ¨ ØªÙˆØ§Ù† ${powerFactor} Ùˆ Ø¶Ø±ÛŒØ¨ Ù‡Ù…Ø²Ù…Ø§Ù†ÛŒ ${simultaneityFactor} Ù¾Ø´Øª Ù¾Ø±Ø¯Ù‡ Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯.`,
  };
}

export function buildLoadProfile(items = [], options = {}) {
  const normalizedItems = items.map(normalizeLoadItem);
  const buckets = { morning: 0, noon: 0, evening: 0, night: 0 };
  normalizedItems.forEach((item) => {
    const profile = item.profile || "mixed";
    const e = item.dailyEnergyWh;
    if (profile === "day") buckets.noon += e;
    else if (profile === "night") buckets.night += e;
    else if (profile === "evening") buckets.evening += e;
    else if (profile === "morning") buckets.morning += e;
    else {
      buckets.morning += Math.round(e * 0.2);
      buckets.noon += Math.round(e * 0.35);
      buckets.evening += Math.round(e * 0.3);
      buckets.night += Math.round(e * 0.15);
    }
  });
  const peakBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "evening";
  return {
    buckets,
    peakBucket,
    peakHours: peakBucket === "night" ? [21, 22, 23] : peakBucket === "noon" ? [11, 12, 13, 14] : peakBucket === "morning" ? [7, 8, 9] : [18, 19, 20, 21],
    simultaneityFactor: Number(options.simultaneityFactor ?? 0.78),
  };
}

export function runLoadEngine(input = {}) {
  const domain = input.domain || localStorage.getItem("shil:scenarioDomain") || "solar";
  const method = input.method || "equipment";
  const voltageAC = Number(input.voltageAC ?? 220) || 220;
  const dcBusVoltage = Number(input.dcBusVoltage ?? (domain === "solar" ? 48 : 24)) || 48;
  const selectedItems = (input.selectedItems || []).map(normalizeLoadItem);
  const scenario = input.scenario || null;
  const fallbackPowerW = Number(scenario?.loadEstimate ?? input.manualPowerW ?? 1000) || 1000;
  const fallbackHours = Number(scenario?.backupHours ?? input.manualHours ?? (domain === "emergency" ? 6 : 5)) || 5;

  const equipmentPowerW = selectedItems.reduce((sum, item) => sum + item.effectivePowerW, 0);
  const equipmentEnergyWh = selectedItems.reduce((sum, item) => sum + item.dailyEnergyWh, 0);
  const equipmentSurgeW = selectedItems.reduce((sum, item) => sum + Math.max(item.surgePowerW, item.effectivePowerW), 0);
  const totalRunningCurrentA = selectedItems.reduce((sum, item) => sum + Number(item.runningCurrentA || item.currentA || 0), 0);
  const totalStartCurrentA = selectedItems.reduce((sum, item) => sum + Number(item.startCurrentA || item.currentA || 0), 0);

  const totalPowerW = Math.round(Number(input.manualPowerW || 0) || equipmentPowerW || fallbackPowerW);
  const totalEnergyWh = Math.round(Number(input.manualEnergyWh || 0) || equipmentEnergyWh || (totalPowerW * fallbackHours));
  const surgePowerW = Math.round(Number(input.manualSurgeW || 0) || equipmentSurgeW || (totalPowerW * 1.6));
  const acCurrentA = selectedItems.length ? round(totalRunningCurrentA, 2) : round(totalPowerW / voltageAC, 2);
  const startCurrentA = selectedItems.length ? round(totalStartCurrentA, 2) : round(acCurrentA * 1.6, 2);
  const dcCurrentA = round(totalPowerW / dcBusVoltage, 2);
  const loadProfile = input.loadProfile || buildLoadProfile(selectedItems, input);
  const motorCount = selectedItems.filter((item) => item.isMotor).length;
  const softStarterCount = selectedItems.filter((item) => item.isMotor && item.hasSoftStarter).length;

  const recommendedVoltage = totalPowerW > 5000 ? 96 : totalPowerW > 2500 ? 48 : 24;
  const recommendedInverterW = Math.ceil((surgePowerW * 1.15) / 500) * 500;
  const recommendedBatteryWh = Math.round(totalEnergyWh * (domain === "emergency" ? 1.25 : 1.45));

  return {
    domain,
    method,
    selectedCount: selectedItems.length,
    selectedItems,
    totalEnergyWh,
    totalEnergyKWh: round(totalEnergyWh / 1000, 2),
    totalPowerW,
    surgePowerW,
    totalCurrentA: acCurrentA,
    acCurrentA,
    dcCurrentA,
    startCurrentA,
    voltageAC,
    dcBusVoltage,
    motorCount,
    softStarterCount,
    loadProfile,
    recommendedVoltage,
    recommendedInverterW,
    recommendedBatteryWh,
    expertSummary: {
      rule: "Ø¶Ø±ÛŒØ¨ ØªÙˆØ§Ù†ØŒ Ø¶Ø±ÛŒØ¨ Ù‡Ù…Ø²Ù…Ø§Ù†ÛŒØŒ Ø³Ø§Ø¹Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ùˆ Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ù¾Ø´Øª Ù¾Ø±Ø¯Ù‡ Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯.",
      motorStartRule: "Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ù…ÙˆØªÙˆØ±ÛŒ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Û².Ûµ Ø¨Ø±Ø§Ø¨Ø± Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ Ùˆ Ø¯Ø± ØµÙˆØ±Øª ÙØ¹Ø§Ù„ Ø¨ÙˆØ¯Ù† Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ± Û±.Û² Ø¨Ø±Ø§Ø¨Ø± Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ Ù„Ø­Ø§Ø¸ Ù…ÛŒâ€ŒØ´ÙˆØ¯.",
      transferredFields: ["totalPowerW", "totalEnergyWh", "acCurrentA", "startCurrentA", "surgePowerW", "selectedItems"],
    },
    nextEngine: domain === "emergency" ? "emergency-core" : "solar-core",
    warnings: buildLoadWarnings({ totalPowerW, totalEnergyWh, surgePowerW, selectedItems, domain }),
    createdAt: new Date().toISOString(),
  };
}

function buildLoadWarnings({ totalPowerW, totalEnergyWh, surgePowerW, selectedItems, domain }) {
  const warnings = [];
  if (!selectedItems.length) warnings.push("Ù‡ÛŒÚ† ØªØ¬Ù‡ÛŒØ²ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡Ø› Ù…Ø­Ø§Ø³Ø¨Ù‡ ÙØ¹Ù„Ø§Ù‹ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯.");
  if (surgePowerW > totalPowerW * 2.5) warnings.push("ØªÙˆØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø¨Ø§Ù„Ø§ Ø§Ø³ØªØ› Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø§ÛŒØ¯ Ø¨Ø±Ø§ÛŒ Ù¾ÛŒÚ© Ø§Ø³ØªØ§Ø±Øª Ø¨Ø±Ø±Ø³ÛŒ Ø´ÙˆØ¯.");
  if (selectedItems.some((item) => item.isMotor && !item.hasSoftStarter)) warnings.push("Ø¨Ø±Ø§ÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…ÙˆØªÙˆØ±ÛŒ Ø¨Ø¯ÙˆÙ† Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ±ØŒ Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Û².Ûµ Ø¨Ø±Ø§Ø¨Ø± Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ Ù„Ø­Ø§Ø¸ Ø´Ø¯Ù‡ Ø§Ø³Øª.");
  if (domain === "solar" && totalEnergyWh > 25000) warnings.push("Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡ Ø¨Ø§Ù„Ø§ Ø§Ø³ØªØ› ÙØ¶Ø§ÛŒ Ù†ØµØ¨ Ù¾Ù†Ù„ Ùˆ Ø¨Ø§ØªØ±ÛŒ Ø¨Ø§ÛŒØ¯ Ø¯Ù‚ÛŒÙ‚ Ú©Ù†ØªØ±Ù„ Ø´ÙˆØ¯.");
  if (domain === "emergency" && totalPowerW > 8000) warnings.push("ØªÙˆØ§Ù† Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø³Ù†Ú¯ÛŒÙ† Ø§Ø³ØªØ› Ø¨Ø±Ø±Ø³ÛŒ Ø³Ù‡â€ŒÙØ§Ø² ÛŒØ§ Ú˜Ù†Ø±Ø§ØªÙˆØ± Ú©Ù…Ú©ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ù…ÛŒâ€ŒØ´ÙˆØ¯.");
  return warnings;
}

export function persistLoadEngineResult(payload) {
  const result = runLoadEngine(payload);
  localStorage.setItem("shil:loadCalculationDraft", JSON.stringify(result));
  localStorage.setItem("shil:calculationMethod", result.method);
  localStorage.setItem("shil:equipmentDraft", JSON.stringify({
    selectedItems: result.selectedItems,
    totalPowerW: result.totalPowerW,
    totalDailyWh: result.totalEnergyWh,
    totalCurrentA: result.totalCurrentA,
    startCurrentA: result.startCurrentA,
    surgePowerW: result.surgePowerW,
    expertSummary: result.expertSummary,
  }));
  return result;
}
