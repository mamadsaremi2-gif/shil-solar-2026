export const number = (value, fallback = 0) => {
  const normalized = String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
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
  return (Array.isArray(items) ? items : []).find((item) => item?.id === id) || null;
}

export function nearestByMinPower(items = [], targetW = 0) {
  const safe = (Array.isArray(items) ? items : []).filter(Boolean);
  const sorted = safe.slice().sort((a, b) => positive(a.ratedPowerW || a.powerW) - positive(b.ratedPowerW || b.powerW));
  return sorted.find((item) => positive(item.ratedPowerW || item.powerW) >= positive(targetW, 0)) || sorted[sorted.length - 1] || null;
}

export function isBatteryCompatibleWithInverter(battery = {}, inverter = {}) {
  const target = batteryVoltageClass(inverter.batteryVoltage || inverter.dcVoltage || inverter.nominalDcVoltage || 48);
  const nominal = number(battery.nominalVoltage || battery.voltageV || battery.dcVoltage, 0);
  if (!nominal) return false;
  if (target === 48) return nominal >= 46 && nominal <= 58;
  if (target === 24) return nominal >= 22 && nominal <= 30;
  if (target === 12) return nominal >= 10 && nominal <= 16;
  return Math.abs(nominal - target) <= 2;
}

export function compatibleBatteriesForInverter(batteries = [], inverter = {}) {
  return (Array.isArray(batteries) ? batteries : []).filter((battery) => isBatteryCompatibleWithInverter(battery, inverter));
}

export function selectCompatibleBattery(batteries = [], inverter = {}, preferredId) {
  const preferred = findById(batteries, preferredId);
  if (preferred && isBatteryCompatibleWithInverter(preferred, inverter)) return preferred;
  const compatible = compatibleBatteriesForInverter(batteries, inverter);
  return compatible[0] || (Array.isArray(batteries) ? batteries[0] : null) || null;
}

export function checkPvInverterCompatibility(panel = {}, inverter = {}, seriesCount = 1, parallelCount = 1, minTempC = 0) {
  const voc = positive(panel.voc, positive(panel.vocRangeV?.[1], 50));
  const vmp = positive(panel.vmp, positive(panel.vmpRangeV?.[0], 40));
  const imp = positive(panel.imp, positive(panel.impRangeA?.[1], 12));
  const tempCoeff = Math.abs(number(panel.tempCoeffVocPctC ?? panel.tempCoeffVocPercentPerC ?? -0.28, -0.28)) / 100;
  const coldVoc = voc * seriesCount * (1 + tempCoeff * Math.max(0, 25 - number(minTempC, 0)));
  const stringVmp = vmp * seriesCount;
  const currentA = imp * parallelCount;
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
    metrics: { coldVoc, stringVmp, currentA, maxDcVoltage, mpptMin, mpptMax },
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
