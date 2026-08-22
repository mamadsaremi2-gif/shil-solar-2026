export const number = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;

  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬|,/g, "")
    .trim();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const positive = (value, fallback = 0) => {
  const parsed = number(value, fallback);
  return parsed > 0 ? parsed : fallback;
};

export function batteryVoltageClass(voltage) {
  const v = number(voltage, 0);
  if (v >= 46 && v <= 58) return 48;
  if (v >= 22 && v <= 30) return 24;
  if (v >= 10 && v <= 16) return 12;
  return v || 48;
}

export function optionLabel(item) {
  return item?.label || item?.title || item?.name || item?.model || item?.id || "-";
}

export function findById(items = [], id) {
  if (!id) return null;
  return (Array.isArray(items) ? items : []).find((item) => String(item?.id) === String(id)) || null;
}

export function nearestByMinPower(items = [], targetW = 0) {
  const target = positive(targetW, 0);
  const sorted = (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .slice()
    .sort((a, b) => positive(a.ratedPowerW || a.powerW) - positive(b.ratedPowerW || b.powerW));
  return sorted.find((item) => positive(item.ratedPowerW || item.powerW) >= target) || sorted[sorted.length - 1] || null;
}

export function isBatteryCompatibleWithInverter(battery = {}, inverter = {}) {
  const target = batteryVoltageClass(inverter.batteryVoltage || inverter.dcVoltage || inverter.nominalDcVoltage || 48);
  const nominal = number(battery.nominalVoltage || battery.voltageV || battery.dcVoltage, 0);
  if (!nominal) return false;
  if (target === 48) return nominal >= 46 && nominal <= 58;
  if (target === 24) return nominal >= 22 && nominal <= 30;
  if (target === 12) return nominal >= 10 && nominal <= 16;
  return Math.abs(nominal - target) <= Math.max(2, target * 0.08);
}

export function batteryEnergyKWh(battery = {}) {
  const directWh = positive(battery.energyWh, 0);
  if (directWh > 0) return directWh / 1000;
  const voltage = positive(battery.nominalVoltage || battery.voltageV || battery.dcVoltage, 0);
  const capacityAh = positive(battery.capacityAh, 0);
  return voltage > 0 && capacityAh > 0 ? (voltage * capacityAh) / 1000 : 0;
}

export function compatibleBatteriesForInverter(batteries = [], inverter = {}) {
  return (Array.isArray(batteries) ? batteries : []).filter((battery) => isBatteryCompatibleWithInverter(battery, inverter));
}

export function selectCompatibleBattery(batteries = [], inverter = {}, preferredId, requiredEnergyKWh = 0) {
  const safe = Array.isArray(batteries) ? batteries : [];
  const preferred = findById(safe, preferredId);
  if (preferred && isBatterySeriesCompatibleWithInverter(preferred, inverter)) return preferred;

  const compatible = safe
    .filter((battery) => isBatteryCompatibleWithInverter(battery, inverter))
    .slice()
    .sort((a, b) => positive(a.capacityAh, 0) - positive(b.capacityAh, 0) || batteryEnergyKWh(a) - batteryEnergyKWh(b));

  return compatible[0] || safe.find((battery) => isBatterySeriesCompatibleWithInverter(battery, inverter)) || null;
}


export function selectDefaultPanel(panels = [], preferredId, targetPowerW = 0) {
  const safe = Array.isArray(panels) ? panels.filter(Boolean) : [];
  const preferred = findById(safe, preferredId);
  if (preferred) return preferred;
  const active = safe.filter((item) => String(item.availability || "active") !== "deprecated");
  const exactDefault = active.find((item) => item.defaultForCalculation === true || positive(item.powerW || item.ratedPowerW, 0) === 620);
  if (exactDefault) return exactDefault;
  return nearestByMinPower(active, positive(targetPowerW, 620)) || active[0] || null;
}

function inverterMatchesSystemType(item = {}, systemType = "offgrid") {
  const type = String(systemType || "").toLowerCase();
  const itemType = String(item.type || item.systemType || "").toLowerCase();
  const isOnGrid = itemType.includes("on grid") || itemType.includes("ongrid") || String(item.series || "").toLowerCase() === "utility";
  const wantsGridOnly = type.includes("ongrid") || type.includes("on-grid") || type === "grid";
  if (wantsGridOnly) return isOnGrid;
  return !isOnGrid && (itemType.includes("off") || itemType.includes("hybrid") || item.parallelCapable || item.batteryVoltage || item.dcVoltage);
}

export function selectSmartInverter(inverters = [], preferredId, requiredPowerW = 0, systemType = "offgrid") {
  const safe = Array.isArray(inverters) ? inverters.filter(Boolean) : [];
  const preferred = findById(safe, preferredId);
  if (preferred && inverterMatchesSystemType(preferred, systemType)) return preferred;

  const candidates = safe
    .filter((item) => inverterMatchesSystemType(item, systemType))
    .sort((a, b) => positive(a.ratedPowerW || a.powerW, 0) - positive(b.ratedPowerW || b.powerW, 0));

  const required = positive(requiredPowerW, 0);
  const type = String(systemType || "").toLowerCase();
  const wantsGridOnly = type.includes("ongrid") || type.includes("on-grid") || type === "grid";
  if (!wantsGridOnly && required > 10000) {
    const parallelCandidates = candidates.filter((item) => {
      const rated = positive(item.ratedPowerW || item.powerW, 0);
      return rated <= 8000 && item.parallelCapable !== false;
    });
    const ranked = parallelCandidates
      .map((item) => {
        const rated = positive(item.ratedPowerW || item.powerW, 0);
        const count = Math.max(1, Math.ceil(required / Math.max(1, rated)));
        const total = rated * count;
        return { item, rated, count, total, oversize: Math.max(0, total - required) };
      })
      .sort((a, b) => a.count - b.count || a.oversize - b.oversize || b.rated - a.rated);
    if (ranked[0]) return ranked[0].item;
  }
  return candidates.find((item) => positive(item.ratedPowerW || item.powerW, 0) >= required) || candidates[candidates.length - 1] || nearestByMinPower(safe, required) || null;
}

export function batterySeriesCountForInverter(battery = {}, inverter = {}) {
  const target = batteryVoltageClass(inverter?.batteryVoltage || inverter?.dcVoltage || inverter?.nominalDcVoltage || 48);
  const nominal = positive(battery?.nominalVoltage || battery?.voltageV || battery?.dcVoltage, 0);
  if (!nominal || !target) return 1;
  if (isBatteryCompatibleWithInverter(battery, inverter)) return 1;
  return Math.max(1, Math.round(target / nominal));
}

export function isBatterySeriesCompatibleWithInverter(battery = {}, inverter = {}) {
  const seriesCount = batterySeriesCountForInverter(battery, inverter);
  const target = batteryVoltageClass(inverter?.batteryVoltage || inverter?.dcVoltage || inverter?.nominalDcVoltage || 48);
  const nominal = positive(battery?.nominalVoltage || battery?.voltageV || battery?.dcVoltage, 0);
  if (!nominal || !target) return false;
  const packVoltage = nominal * seriesCount;
  if (target === 48) return packVoltage >= 46 && packVoltage <= 58;
  if (target === 24) return packVoltage >= 22 && packVoltage <= 30;
  if (target === 12) return packVoltage >= 10 && packVoltage <= 16;
  return Math.abs(packVoltage - target) <= Math.max(2, target * 0.08);
}

export function checkPvInverterCompatibility(panel = {}, inverter = {}, seriesCount = 1, parallelCount = 1, minTempC = 0) {
  const voc = positive(panel.voc, positive(panel.vocRangeV?.[1], 50));
  const vmp = positive(panel.vmp, positive(panel.vmpRangeV?.[0], 40));
  const imp = positive(panel.imp, positive(panel.impRangeA?.[1], 12));
  const tempCoeff = Math.abs(number(panel.tempCoeffVocPctC ?? panel.tempCoeffVocPercentPerC ?? -0.28, -0.28)) / 100;
  const safeSeries = Math.max(1, Math.floor(positive(seriesCount, 1)));
  const safeParallel = Math.max(1, Math.floor(positive(parallelCount, 1)));
  const coldVoc = voc * safeSeries * (1 + tempCoeff * Math.max(0, 25 - number(minTempC, 0)));
  const stringVmp = vmp * safeSeries;
  const mpptCount = Math.max(1, Math.floor(positive(inverter.mpptCount, 1)));
  const parallelPerMppt = Math.max(1, Math.ceil(safeParallel / mpptCount));
  const currentA = imp * parallelPerMppt;
  const totalArrayCurrentA = imp * safeParallel;
  const maxDcVoltage = positive(inverter.maxDcVoltage || inverter.maxPvVoc || inverter.maxPvVocV, 500);
  const mpptMin = positive(inverter.mpptMinV || inverter.mpptMinVoltage, 60);
  const mpptMax = positive(inverter.mpptMaxV || inverter.mpptMaxVoltage, 450);
  const maxPvInputCurrentA = positive(inverter.maxPvInputCurrentA, Infinity);
  const issues = [];

  if (coldVoc > maxDcVoltage) issues.push({ code: "PV_MAX_DC_EXCEEDED", severity: "error", message: "ولتاژ Voc سرد رشته از حد مجاز اینورتر بیشتر است." });
  if (stringVmp < mpptMin || stringVmp > mpptMax) issues.push({ code: "PV_MPPT_MISMATCH", severity: "error", message: "ولتاژ کاری رشته خارج از بازه MPPT اینورتر است." });
  if (currentA > maxPvInputCurrentA) issues.push({ code: "PV_INPUT_CURRENT_HIGH", severity: "warning", message: "جریان ورودی PV به بازبینی MPPT یا تقسیم رشته نیاز دارد." });

  return {
    compatible: !issues.some((issue) => issue.severity === "error"),
    metrics: { coldVoc, stringVmp, currentA, totalArrayCurrentA, parallelPerMppt, mpptCount, maxDcVoltage, mpptMin, mpptMax },
    issues,
  };
}

export function filterSolarBankByProjectPath(items = [], projectPath = "solar") {
  const safe = Array.isArray(items) ? items : [];
  if (projectPath === "utility") {
    return safe.filter((item) => positive(item.powerW || item.ratedPowerW, 0) >= 30000 || String(item.useCase || item.type || item.title || "").includes("نیروگاهی") || String(item.series || "").toLowerCase().includes("utility"));
  }
  return safe.filter((item) => !String(item.series || "").toLowerCase().includes("utility") || projectPath === "utility");
}

export function designPvStringLayout(panel = {}, inverter = {}, requiredPanelCount = 1, minTempC = 0) {
  const count = Math.max(1, Math.ceil(positive(requiredPanelCount, 1)));
  const voc = positive(panel.voc, positive(panel.vocRangeV?.[1], 50));
  const vmp = positive(panel.vmp, positive(panel.vmpRangeV?.[0], 40));
  const imp = positive(panel.imp, positive(panel.impRangeA?.[1], 12));
  const tempCoeff = Math.abs(number(panel.tempCoeffVocPctC ?? panel.tempCoeffVocPercentPerC ?? -0.28, -0.28)) / 100;
  const coldVocPerPanel = voc * (1 + tempCoeff * Math.max(0, 25 - number(minTempC, 0)));
  const maxDcVoltage = positive(inverter.maxDcVoltage || inverter.maxPvVoc || inverter.maxPvVocV, 500);
  const mpptMin = positive(inverter.mpptMinV || inverter.mpptMinVoltage, 60);
  const mpptMax = positive(inverter.mpptMaxV || inverter.mpptMaxVoltage, 450);
  const maxPvInputCurrentA = positive(inverter.maxPvInputCurrentA, Infinity);
  const mpptCount = Math.max(1, Math.floor(positive(inverter.mpptCount, 1)));

  const minSeries = Math.max(1, Math.ceil(mpptMin / Math.max(1, vmp)));
  const maxSeriesByMppt = Math.max(1, Math.floor(mpptMax / Math.max(1, vmp)));
  const maxSeriesByVoc = Math.max(1, Math.floor(maxDcVoltage / Math.max(1, coldVocPerPanel)));
  const maxSeries = Math.max(1, Math.min(maxSeriesByMppt, maxSeriesByVoc));

  let best = null;
  for (let series = minSeries; series <= maxSeries; series += 1) {
    const parallel = Math.max(1, Math.ceil(count / series));
    const actualPanelCount = series * parallel;
    const compatibility = checkPvInverterCompatibility(panel, inverter, series, parallel, minTempC);
    const parallelPerMppt = Math.max(1, Math.ceil(parallel / mpptCount));
    const currentOverflow = Math.max(0, imp * parallelPerMppt - maxPvInputCurrentA);
    const extraPanels = actualPanelCount - count;
    const mpptDistributionPenalty = mpptCount > 1 && parallel <= mpptCount ? Math.abs(mpptCount - parallel) * 5 : 0;
    const score = (compatibility.compatible ? 0 : 100000) + currentOverflow * 1000 + extraPanels * 10 + parallel + mpptDistributionPenalty;
    const candidate = { seriesCount: series, parallelCount: parallel, actualPanelCount, extraPanels, compatibility, score };
    if (!best || candidate.score < best.score) best = candidate;
  }

  if (best) return best;

  const fallbackSeries = Math.max(1, minSeries);
  const fallbackParallel = Math.max(1, Math.ceil(count / fallbackSeries));
  return {
    seriesCount: fallbackSeries,
    parallelCount: fallbackParallel,
    actualPanelCount: fallbackSeries * fallbackParallel,
    extraPanels: fallbackSeries * fallbackParallel - count,
    compatibility: checkPvInverterCompatibility(panel, inverter, fallbackSeries, fallbackParallel, minTempC),
    score: Infinity,
  };
}
