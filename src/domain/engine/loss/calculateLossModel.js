function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clampPercent(value, min = 0, max = 80) {
  const n = Number(value) || 0;
  return Math.min(Math.max(n, min), max);
}

export function calculateLossModel(input, pv, cabling, installation, shadowAnalysis, climate) {
  if (input.systemType === "backup" || !pv) {
    return {
      applicable: false,
      totalLossPercent: 0,
      netPerformanceRatio: 1,
      components: [],
      status: "not_applicable",
      message: "در برق اضطراری، Loss Model خورشیدی اعمال نمی‌شود.",
    };
  }

  const temperatureLossPercent = clampPercent(
    pv?.lossesBreakdown?.temperatureLossPercent ?? ((1 - (pv?.temperatureLossFactor || 1)) * 100),
    0,
    30,
  );
  const dcCableLossPercent = clampPercent(cabling?.dc?.voltageDropPercent ?? ((1 - (input.cableLossFactor || 0.97)) * 100), 0, 8);
  const batteryCableLossPercent = clampPercent(cabling?.battery?.voltageDropPercent ?? 0, 0, 8);
  const acCableLossPercent = clampPercent(cabling?.ac?.voltageDropPercent ?? 0, 0, 8);
  const cableLossPercent = clampPercent(dcCableLossPercent + batteryCableLossPercent + acCableLossPercent, 0, 12);
  const dustLossPercent = clampPercent((1 - (input.dustFactor || climate?.dustFactor || 0.96)) * 100, 0, 25);
  const shadowLossPercent = clampPercent(shadowAnalysis?.totalLossPercent ?? ((1 - (input.shadingFactor || 0.95)) * 100), 0, 60);
  const orientationLossPercent = clampPercent(installation?.orientation?.orientationLossPercent ?? Number(input.orientationLossPercent || 0), 0, 25);
  const tiltLossPercent = clampPercent(installation?.tilt?.tiltLossPercent ?? Number(input.tiltLossPercent || 0), 0, 25);
  const angleLossPercent = clampPercent(orientationLossPercent + tiltLossPercent, 0, 35);
  const mismatchLossPercent = clampPercent(Number(input.mismatchLossPercent ?? 2), 0, 8);
  const mpptLossPercent = clampPercent(Number(input.mpptLossPercent ?? (pv?.mpptDesign?.status === "pass" ? 1.2 : 3.5)), 0, 8);

  const components = [
    { key: "temperature", title: "تلفات دما", percent: round(temperatureLossPercent, 2), source: "Temperature Correction" },
    { key: "cable", title: "تلفات کابل DC/AC", percent: round(cableLossPercent, 2), source: "IEC Cable Engine" },
    { key: "dust", title: "تلفات گردوغبار", percent: round(dustLossPercent, 2), source: "Climate/Site Factor" },
    { key: "angle", title: "تلفات زاویه و جهت", percent: round(angleLossPercent, 2), source: "Azimuth/Tilt" },
    { key: "shadow", title: "تلفات سایه", percent: round(shadowLossPercent, 2), source: "Shadow Analysis" },
    { key: "mismatch", title: "تلفات mismatch پنل‌ها", percent: round(mismatchLossPercent, 2), source: "Engineering Default" },
    { key: "mppt", title: "تلفات MPPT", percent: round(mpptLossPercent, 2), source: "MPPT Design" },
  ];

  const netPerformanceRatio = components.reduce((ratio, item) => ratio * (1 - item.percent / 100), 1);
  const totalLossPercent = round((1 - netPerformanceRatio) * 100, 2);
  const grossDailyWh = pv.installedPvPowerW * Math.max(input.sunHours || climate?.correctedPsh || 0, 0);
  const netDailyWh = grossDailyWh * netPerformanceRatio;
  const warnings = [];
  if (totalLossPercent > 28) warnings.push("تلفات کل سیستم بالا است؛ سایه، کابل یا زاویه نصب باید اصلاح شود.");
  if (cableLossPercent > 4) warnings.push("افت ولتاژ کابل زیاد است؛ سایز کابل یا مسیر کابل‌کشی بازبینی شود.");
  if (shadowLossPercent > 12) warnings.push("تلفات سایه قابل توجه است؛ جابه‌جایی آرایه یا تغییر زاویه/محل نصب پیشنهاد می‌شود.");

  return {
    applicable: true,
    components,
    temperatureLossPercent: round(temperatureLossPercent, 2),
    cableLossPercent: round(cableLossPercent, 2),
    dustLossPercent: round(dustLossPercent, 2),
    angleLossPercent: round(angleLossPercent, 2),
    shadowLossPercent: round(shadowLossPercent, 2),
    mismatchLossPercent: round(mismatchLossPercent, 2),
    mpptLossPercent: round(mpptLossPercent, 2),
    totalLossPercent,
    netPerformanceRatio: round(netPerformanceRatio, 4),
    grossDailyProductionWh: round(grossDailyWh, 1),
    netDailyProductionWh: round(netDailyWh, 1),
    annualNetProductionKwh: round((netDailyWh * 365) / 1000, 1),
    status: warnings.length ? "warning" : "pass",
    warnings,
  };
}
