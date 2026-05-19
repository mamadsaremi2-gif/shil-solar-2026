export const DEFAULT_SOLAR_AZIMUTH_DEG = 180;
export const DEFAULT_PANEL_TILT_FALLBACK_DEG = 32;

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clampNumber(value, min, max, fallback = min) {
  const number = toNumber(value, fallback);
  return Math.max(min, Math.min(max, number));
}

export function estimateRecommendedTilt(latitude) {
  const lat = Math.abs(toNumber(latitude, DEFAULT_PANEL_TILT_FALLBACK_DEG));
  if (!Number.isFinite(lat)) return DEFAULT_PANEL_TILT_FALLBACK_DEG;
  return Math.round(clampNumber(lat * 0.9, 15, 45, DEFAULT_PANEL_TILT_FALLBACK_DEG));
}

export function estimateThermalDeratePercent(maxTemperatureC) {
  const maxTemp = toNumber(maxTemperatureC, 40);
  if (maxTemp <= 35) return 0;
  if (maxTemp <= 42) return 2;
  if (maxTemp <= 47) return 4;
  return 6;
}

export function estimateCorrosionRisk({ humidity, installType }) {
  const h = toNumber(humidity, 30);
  if (installType === "coastal" || h >= 70) return "high";
  if (installType === "industrial" || h >= 55) return "medium";
  return "low";
}

export function estimateIngressProtection({ humidity, installType }) {
  const risk = estimateCorrosionRisk({ humidity, installType });
  if (risk === "high") return "IP65 / IP66";
  if (risk === "medium") return "IP54 / IP65";
  return "IP54";
}

export function buildEnvironmentWarnings(environment) {
  const warnings = [];
  const humidity = toNumber(environment.humidity, 30);
  const maxTemp = toNumber(environment.temperatureMaxC, 40);
  const minTemp = toNumber(environment.temperatureMinC, 0);
  const sun = toNumber(environment.peakSunHours, 0);
  const soiling = toNumber(environment.soilingLossPercent, 3);

  if (environment.domain === "solar" && sun < 4.2) {
    warnings.push("Ø³Ø§Ø¹Øª Ø¢ÙØªØ§Ø¨ÛŒ Ù…Ø¤Ø«Ø± Ù¾Ø§ÛŒÛŒÙ† Ø§Ø³ØªØ› ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„ ÛŒØ§ Ø¸Ø±ÙÛŒØª ØªÙˆÙ„ÛŒØ¯ Ø¨Ø§ÛŒØ¯ Ø¨Ø§ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø¨ÛŒØ´ØªØ± Ø¨Ø±Ø±Ø³ÛŒ Ø´ÙˆØ¯.");
  }
  if (maxTemp >= 45) {
    warnings.push("Ø¯Ù…Ø§ÛŒ Ø¨ÛŒØ´ÛŒÙ†Ù‡ Ø¨Ø§Ù„Ø§ Ø§Ø³ØªØ› Ø§ÙØª Ø­Ø±Ø§Ø±ØªÛŒ Ù¾Ù†Ù„/Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¯Ø± Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ù„Ø­Ø§Ø¸ Ø´ÙˆØ¯.");
  }
  if (minTemp <= -10) {
    warnings.push("Ø­Ø¯Ø§Ù‚Ù„ Ø¯Ù…Ø§ÛŒ Ù¾Ø§ÛŒÛŒÙ† Ø§Ø³ØªØ› ÙˆÙ„ØªØ§Ú˜ Ù…Ø¯Ø§Ø± Ø¨Ø§Ø² Ù¾Ù†Ù„ Ø¯Ø± Ø³Ø±Ù…Ø§ÛŒ Ø´Ø¯ÛŒØ¯ Ú©Ù†ØªØ±Ù„ Ø´ÙˆØ¯.");
  }
  if (humidity >= 65 || environment.installType === "coastal") {
    warnings.push("Ø±Ø·ÙˆØ¨Øª ÛŒØ§ Ù…Ø­ÛŒØ· Ø³Ø§Ø­Ù„ÛŒ Ø¨Ø§Ù„Ø§Ø³ØªØ› ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¶Ø¯Ø®ÙˆØ±Ø¯Ú¯ÛŒ Ùˆ ØªØ§Ø¨Ù„Ùˆ Ø¨Ø§ IP Ø¨Ø§Ù„Ø§ØªØ± Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ù…ÛŒâ€ŒØ´ÙˆØ¯.");
  }
  if (soiling >= 6 || environment.installType === "desert" || environment.installType === "industrial") {
    warnings.push("Ø¢Ù„ÙˆØ¯Ú¯ÛŒ/Ú¯Ø±Ø¯ÙˆØºØ¨Ø§Ø± Ù‚Ø§Ø¨Ù„ ØªÙˆØ¬Ù‡ Ø§Ø³ØªØ› Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø´Ø³Øªâ€ŒÙˆØ´ÙˆÛŒ Ù¾Ù†Ù„ Ùˆ Ø¶Ø±ÛŒØ¨ Soiling Ù„Ø­Ø§Ø¸ Ø´ÙˆØ¯.");
  }
  if (!environment.compassAttachment) {
    warnings.push("Ø§Ø³Ú©Ø±ÛŒÙ†â€ŒØ´Ø§Øª Ù‚Ø·Ø¨â€ŒÙ†Ù…Ø§ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ù†Ø´Ø¯Ù‡Ø› Ø¬Ù‡Øª Ù†Ù‡Ø§ÛŒÛŒ Ù¾Ù†Ù„ Ø¨Ø§ÛŒØ¯ Ø¯Ø± Ø¨Ø§Ø²Ø¯ÛŒØ¯ Ù…Ø­Ù„ ØªØ£ÛŒÛŒØ¯ Ø´ÙˆØ¯.");
  }
  if (!environment.siteAttachment && environment.domain === "solar") {
    warnings.push("ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ù†Ø´Ø¯Ù‡Ø› Ø±ÛŒØ³Ú© Ø³Ø§ÛŒÙ‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ùˆ Ù…Ø­Ø¯ÙˆØ¯ÛŒØª ÙØ¶Ø§ÛŒ Ù†ØµØ¨ Ù‡Ù†ÙˆØ² Ø¯Ø³ØªÛŒ Ø¨Ø±Ø±Ø³ÛŒ Ù…ÛŒâ€ŒØ´ÙˆØ¯.");
  }
  return warnings;
}

export function analyzeEnvironmentForEngineering(environment = {}) {
  const domain = environment.domain || "solar";
  const recommendedTiltDeg = domain === "solar" ? estimateRecommendedTilt(environment.latitude) : 0;
  const recommendedAzimuthDeg = domain === "solar" ? DEFAULT_SOLAR_AZIMUTH_DEG : 0;
  const thermalDeratePercent = domain === "solar" ? estimateThermalDeratePercent(environment.temperatureMaxC) : 0;
  const corrosionRisk = estimateCorrosionRisk(environment);
  const recommendedIngressProtection = estimateIngressProtection(environment);
  const needsAntiCorrosion = corrosionRisk !== "low";
  const manualReviewRequired = Boolean(!environment.compassAttachment || (domain === "solar" && !environment.siteAttachment));
  const warnings = buildEnvironmentWarnings({ ...environment, domain });

  return {
    status: warnings.length ? "needs-review" : "ready",
    domain,
    recommendedTiltDeg,
    recommendedAzimuthDeg,
    thermalDeratePercent,
    corrosionRisk,
    recommendedIngressProtection,
    needsAntiCorrosion,
    manualReviewRequired,
    compassAnalysis: {
      mode: environment.compassAttachment ? "uploaded" : "not-provided",
      assumedSouthAzimuthDeg: recommendedAzimuthDeg,
      note: environment.compassAttachment
        ? "ÙØ§ÛŒÙ„ Ù‚Ø·Ø¨â€ŒÙ†Ù…Ø§ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ø› Ø¬Ù‡Øª Ø¬Ù†ÙˆØ¨ Ø¨Ù‡â€ŒØ¹Ù†ÙˆØ§Ù† Ù…Ø¨Ù†Ø§ÛŒ Ø§ÙˆÙ„ÛŒÙ‡ Ø·Ø±Ø§Ø­ÛŒ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ùˆ Ø¯Ø± Ø¨Ø§Ø²Ø¯ÛŒØ¯ Ù‚Ø§Ø¨Ù„ Ø§ØµÙ„Ø§Ø­ Ø§Ø³Øª."
        : "Ø¨Ø¯ÙˆÙ† ØªØµÙˆÛŒØ± Ù‚Ø·Ø¨â€ŒÙ†Ù…Ø§ØŒ Ø¬Ù‡Øª Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø¬Ù†ÙˆØ¨ Ø¨Ø±Ø§ÛŒ Ø§ÛŒØ±Ø§Ù† Ø¨Ù‡â€ŒØµÙˆØ±Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø¯Ø± Ù†Ø¸Ø± Ú¯Ø±ÙØªÙ‡ Ø´Ø¯.",
    },
    siteImageAnalysis: {
      mode: environment.siteAttachment ? "uploaded" : "not-provided",
      shadingRisk: environment.siteAttachment ? "manual-review" : "unknown",
      note: environment.siteAttachment
        ? "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ø› Ø¨Ø±Ø§ÛŒ ØªØ´Ø®ÛŒØµ Ø¯Ù‚ÛŒÙ‚ Ø³Ø§ÛŒÙ‡/Ù…Ø§Ù†Ø¹ Ø¨Ø§ÛŒØ¯ Ø¯Ø± Ù…Ø±Ø­Ù„Ù‡ AI Vision ÛŒØ§ Ø¨Ø§Ø²Ø¯ÛŒØ¯ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø¨Ø±Ø±Ø³ÛŒ Ø´ÙˆØ¯."
        : "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ù…ÙˆØ¬ÙˆØ¯ Ù†ÛŒØ³ØªØ› Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¨Ø§ ÙØ±Ø¶ Ù†Ø¨ÙˆØ¯ Ø³Ø§ÛŒÙ‡ Ù…Ø³ØªÙ‚ÛŒÙ… Ø§Ø¯Ø§Ù…Ù‡ Ù¾ÛŒØ¯Ø§ Ù…ÛŒâ€ŒÚ©Ù†Ø¯.",
    },
    warnings,
  };
}
