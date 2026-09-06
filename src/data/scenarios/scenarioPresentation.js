const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const FA_NUMBER_WORDS = {
  "صفر": 0, "یک": 1, "يك": 1, "یه": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5,
  "شش": 6, "هفت": 7, "هشت": 8, "نه": 9, "ده": 10, "یازده": 11, "دوازده": 12,
  "سیزده": 13, "چهارده": 14, "پانزده": 15, "شانزده": 16, "هفده": 17, "هجده": 18,
  "نوزده": 19, "بیست": 20, "سی": 30, "چهل": 40, "پنجاه": 50, "شصت": 60,
  "هفتاد": 70, "هشتاد": 80, "نود": 90, "صد": 100, "یکصد": 100, "دویست": 200,
  "سیصد": 300, "چهارصد": 400, "پانصد": 500, "ششصد": 600, "هفتصد": 700,
  "هشتصد": 800, "نهصد": 900,
};

export function normalizeScenarioSearchText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (char) => String(PERSIAN_DIGITS.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(ARABIC_DIGITS.indexOf(char)))
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/\u200c/g, " ")
    .replace(/,/g, "")
    .replace(/\s+/g, " ");
}

function compactNumber(value, maxDigits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return Number(number.toFixed(maxDigits)).toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

export function formatPower(valueW) {
  const watts = Number(valueW);
  if (!Number.isFinite(watts)) return "—";
  if (Math.abs(watts) >= 1000 && watts % 1000 === 0) return `${compactNumber(watts / 1000)} KW`;
  return `${compactNumber(watts, 0)} W`;
}

export function formatPowerTitle(valueW) {
  const watts = Number(valueW);
  if (!Number.isFinite(watts)) return "—";
  if (Math.abs(watts) < 1000) return `${compactNumber(watts, 0)} W`;
  return `${compactNumber(watts / 1000, 3)} KW · ${compactNumber(watts, 0)} W`;
}

export function formatEnergy(valueWh) {
  const wh = Number(valueWh);
  if (!Number.isFinite(wh)) return "—";
  if (Math.abs(wh) >= 1000 && wh % 1000 === 0) return `${compactNumber(wh / 1000)} KWH`;
  return `${compactNumber(wh, 0)} WH`;
}

export function formatCurrent(valueA) {
  const amps = Number(valueA);
  if (!Number.isFinite(amps)) return "—";
  return `${compactNumber(amps)} A`;
}

function parsePersianNumberWords(source = "") {
  const normalized = normalizeScenarioSearchText(source)
    .replace(/-/g, " ")
    .replace(/(^|\s)و(?=\s|$)/g, " ")
    .trim();
  if (!normalized) return null;
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized);

  const tokens = normalized.split(/\s+/).filter(Boolean);
  let total = 0;
  let group = 0;
  let recognized = 0;

  for (const token of tokens) {
    if (token === "هزار") {
      group = group || 1;
      total += group * 1000;
      group = 0;
      recognized += 1;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(FA_NUMBER_WORDS, token)) {
      group += FA_NUMBER_WORDS[token];
      recognized += 1;
      continue;
    }
    return null;
  }

  return recognized ? total + group : null;
}

function extractValueBeforeUnit(normalizedQuery, unitPattern) {
  const match = normalizedQuery.match(new RegExp(`(.+?)\\s*(?:${unitPattern})(?:\\s|$)`));
  if (!match) return null;
  const raw = match[1].trim();
  const numeric = raw.match(/(\d+(?:\.\d+)?)\s*$/);
  if (numeric) return Number(numeric[1]);
  return parsePersianNumberWords(raw);
}

export function parseScenarioSearchIntent(query = "") {
  const q = normalizeScenarioSearchText(query);
  if (!q) return { type: "all", query: "" };

  // Energy must be detected before power because Persian energy units contain the word "وات".
  const energyIsKwh = /(?:kwh|کیلو\s*وات\s*ساعت|کیلووات\s*ساعت)/.test(q);
  const energyIsWh = !energyIsKwh && /(?:\bwh\b|وات\s*ساعت)/.test(q);
  if (energyIsKwh || energyIsWh) {
    const pattern = energyIsKwh ? "kwh|کیلو\\s*وات\\s*ساعت|کیلووات\\s*ساعت" : "wh|وات\\s*ساعت";
    const number = extractValueBeforeUnit(q, pattern);
    if (Number.isFinite(number)) {
      const valueWh = number * (energyIsKwh ? 1000 : 1);
      const bucketStartWh = Math.floor(valueWh / 1000) * 1000;
      return { type: "energy", valueWh, min: bucketStartWh, max: bucketStartWh + 999.999 };
    }
  }

  const powerIsKw = /(?:kw|کیلو\s*وات|کیلووات)/.test(q);
  const powerIsW = !powerIsKw && /(?:w(?:\s|$)|وات)/.test(q);
  if (powerIsKw || powerIsW) {
    const pattern = powerIsKw ? "kw|کیلو\\s*وات|کیلووات" : "w|وات";
    const number = extractValueBeforeUnit(q, pattern);
    if (Number.isFinite(number)) {
      const valueW = number * (powerIsKw ? 1000 : 1);
      const bucketStartW = Math.floor(valueW / 1000) * 1000;
      return { type: "power", valueW, min: bucketStartW, max: bucketStartW + 999.999 };
    }
  }

  return { type: "text", query: q };
}


export function parseScenarioCurrentSearchIntent(query = "") {
  const q = normalizeScenarioSearchText(query);
  if (!q) return { type: "all", query: "" };
  const hasAmpUnit = /(?:a(?:\s|$)|آمپر|امپر)/.test(q);
  const cleaned = q.replace(/(?:a(?:\s|$)|آمپر|امپر)/g, " ").trim();
  let number = null;
  const numeric = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (numeric) number = Number(numeric[1]);
  else number = parsePersianNumberWords(cleaned);
  if (!Number.isFinite(number)) return { type: "text", query: q };
  const bucketStartA = Math.floor(number);
  return { type: "current", valueA: number, min: bucketStartA, max: bucketStartA + 0.999999, explicitUnit: hasAmpUnit };
}

export function parseScenarioBackupSearchIntent(query = "") {
  const q = normalizeScenarioSearchText(query);
  if (!q) return { type: "all", query: "" };
  const cleaned = q.replace(/(?:ساعت|ساعته|hour|hours|hr|hrs)/g, " ").trim();
  let number = null;
  const numeric = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (numeric) number = Number(numeric[1]);
  else number = parsePersianNumberWords(cleaned);
  if (!Number.isFinite(number)) return { type: "text", query: q };
  return { type: "backup", hours: number };
}

export function scenarioMatchesEmergencyFilters(scenario, filters = {}) {
  const powerQuery = String(filters.power || "").trim();
  const currentQuery = String(filters.current || "").trim();
  const backupQuery = String(filters.backup || "").trim();

  if (powerQuery && !scenarioMatchesQuery(scenario, powerQuery)) return false;

  if (currentQuery) {
    const intent = parseScenarioCurrentSearchIntent(currentQuery);
    if (intent.type === "current") {
      const currentA = Number(scenario.totalCurrentA ?? scenario.currentA);
      if (!Number.isFinite(currentA) || currentA < intent.min || currentA > intent.max) return false;
    } else if (intent.type === "text" && !scenarioSearchHaystack(scenario).includes(intent.query)) {
      return false;
    }
  }

  if (backupQuery) {
    const intent = parseScenarioBackupSearchIntent(backupQuery);
    if (intent.type === "backup") {
      const hours = Number(scenario.backupHours);
      if (!Number.isFinite(hours) || Math.abs(hours - intent.hours) > 0.001) return false;
    } else if (intent.type === "text" && !scenarioSearchHaystack(scenario).includes(intent.query)) {
      return false;
    }
  }

  return true;
}

export function scenarioSearchHaystack(scenario = {}) {
  const values = [
    scenario.id,
    scenario.numericId,
    scenario.title,
    scenario.description,
    scenario.category,
    scenario.level,
    scenario.levelKey,
    scenario.city,
    scenario.province,
    scenario.inverter,
    scenario.batteryType,
    scenario.suggestedBattery,
    ...(scenario.requiredEquipment?.recommendedItems || []),
  ];
  return normalizeScenarioSearchText(values.filter((value) => value !== undefined && value !== null && value !== "").join(" "));
}

export function scenarioMatchesQuery(scenario, query) {
  const intent = parseScenarioSearchIntent(query);
  if (intent.type === "all") return true;

  // Priority 1: approximate power. A 3 KW query means the complete 3000..3999 W band.
  if (intent.type === "power") {
    const loadW = Number(scenario.loadEstimate);
    return Number.isFinite(loadW) && loadW >= intent.min && loadW <= intent.max;
  }

  // Priority 2: daily energy. The same 1 kWh-wide bucket rule is used for energy.
  if (intent.type === "energy") {
    const dailyWh = Number(scenario.dailyEnergyWh);
    return Number.isFinite(dailyWh) && dailyWh >= intent.min && dailyWh <= intent.max;
  }

  // Priority 3: city/province and then the remaining textual scenario fields.
  const city = normalizeScenarioSearchText(scenario.city || "");
  const province = normalizeScenarioSearchText(scenario.province || "");
  if (city.includes(intent.query) || province.includes(intent.query)) return true;
  return scenarioSearchHaystack(scenario).includes(intent.query);
}
