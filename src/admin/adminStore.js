const ADMIN_KEYS = {
  projectPathCards: "shil:admin:projectPathCards",
  equipmentCatalog: "shil:admin:equipmentCatalog",
  defaults: "shil:admin:defaults",
  auditLog: "shil:admin:auditLog",
  snapshots: "shil:admin:snapshots",
  security: "shil:admin:security",
  version: "shil:admin:version",
  engineeringRules: "shil:admin:engineeringRules",
  standards: "shil:admin:standards",
  releases: "shil:admin:releases",
};

export const ADMIN_SYSTEM_VERSION = "SHIL_ADMIN_SYSTEM_160_PHASE6_ERROR_DIAGNOSTICS_CENTER";

export const DEFAULT_PROJECT_PATH_CARDS = [
  {
    key: "solar",
    title: "اجرای پروژه با پنل خورشیدی",
    description: "طراحی سیستم خورشیدی با پنل، باتری، اینورتر و حفاظت",
    image: "/assets/shil/execution/solar-execution.webp",
    calculationDomain: "solar",
    active: true,
    order: 1,
  },
  {
    key: "emergency",
    title: "اجرای پروژه با برق اضطراری",
    description: "طراحی سیستم پشتیبان با اینورتر و باتری",
    image: "/assets/shil/execution/emergency-inverter-battery.webp",
    calculationDomain: "emergency",
    active: true,
    order: 2,
  },
  {
    key: "future",
    title: "توسعه",
    description: "در حال توسعه",
    image: "/assets/shil/execution/future.svg",
    calculationDomain: "future",
    active: true,
    order: 3,
  },
];

export const DEFAULT_EQUIPMENT_CATALOG = {
  solarPanels: [
    { id: "panel-620", title: "پنل مونو ۶۲۰ وات", brand: "SHIL Standard", powerW: 620, voltageV: 41.2, currentA: 15.05, efficiency: 22.4, active: true, note: "پنل پیش‌فرض موتور خورشیدی" },
    { id: "panel-700", title: "پنل مونو ۷۰۰ وات", brand: "SHIL Manual", powerW: 700, voltageV: 42.8, currentA: 16.36, efficiency: 22.8, active: true, note: "گزینه دستی کاربر" },
  ],
  solarInverters: [
    { id: "inv-offgrid-5", title: "اینورتر خورشیدی آفگرید ۵ کیلووات", brand: "SHIL Standard", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "offgrid", active: true },
    { id: "inv-hybrid-5", title: "اینورتر خورشیدی هیبرید ۵ کیلووات", brand: "SHIL Standard", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "hybrid", active: true },
    { id: "inv-ongrid-6", title: "اینورتر خورشیدی آنگرید ۶ کیلووات", brand: "SHIL Standard", powerKw: 6, dcVoltageV: 0, mpptMinV: 150, mpptMaxV: 850, type: "ongrid", active: true },
  ],
  batteries: [
    { id: "bat-lfp-48-100", title: "باتری LiFePO4 48V 100Ah", brand: "SHIL Standard", voltageV: 48, capacityAh: 100, chemistry: "LiFePO4", dod: 0.8, active: true },
    { id: "bat-lfp-24-200", title: "باتری LiFePO4 24V 200Ah", brand: "SHIL Standard", voltageV: 24, capacityAh: 200, chemistry: "LiFePO4", dod: 0.8, active: true },
  ],
  emergencyPower: [
    { id: "ep-3k", title: "دستگاه برق اضطراری ۳ کیلووات", brand: "SHIL Standard", powerKw: 3, batteryVoltageV: 48, active: true, note: "برای بارهای سبک" },
    { id: "ep-5k", title: "دستگاه برق اضطراری ۵ کیلووات", brand: "SHIL Standard", powerKw: 5, batteryVoltageV: 48, active: true, note: "برای بارهای متوسط" },
  ],
  protections: [
    { id: "prot-dc-spd", title: "SPD سمت DC", group: "solar", rating: "Type II", active: true },
    { id: "prot-ac-mcb", title: "کلید مینیاتوری AC", group: "shared", rating: "C Curve", active: true },
    { id: "prot-earth", title: "سیستم ارت حفاظتی", group: "shared", rating: "استاندارد اجرایی", active: true },
    { id: "prot-emergency-bypass", title: "کلید بای‌پس برق اضطراری", group: "emergency", rating: "Manual Bypass", active: true },
  ],
};

export const DEFAULT_ENGINEERING_RULES = {
  version: "RULES-1.0.0",
  status: "draft",
  solar: {
    safetyFactor: 1.25, dcAcRatioMin: 1.0, dcAcRatioMax: 1.35, voltageMarginPct: 10, temperatureDeratingPct: 8, stringCurrentFactor: 1.25,
  },
  battery: {
    defaultDod: 0.8, roundTripEfficiency: 0.92, reservePct: 15, temperatureDeratingPct: 5,
  },
  emergency: {
    safetyFactor: 1.25, startupMarginFactor: 1.2, minimumBackupHours: 2, reservePct: 15,
  },
  protection: {
    breakerFactor: 1.25, fuseFactor: 1.25, dcIsolatorFactor: 1.25, spdDcType: "Type II", spdAcType: "Type II",
  },
  cable: {
    maxVoltageDropDcPct: 2, maxVoltageDropAcPct: 3, ampacityMarginFactor: 1.25,
  },
};

export const DEFAULT_ENGINEERING_STANDARDS = [
  { id: "iec-62548", code: "IEC 62548", title: "Photovoltaic arrays — Design requirements", domain: "solar", active: true, note: "طراحی آرایه و الزامات DC" },
  { id: "iec-60364-7-712", code: "IEC 60364-7-712", title: "Low-voltage installations — Solar PV systems", domain: "solar", active: true, note: "نصب و حفاظت سامانه PV" },
  { id: "iec-62109", code: "IEC 62109", title: "Safety of power converters for photovoltaic systems", domain: "inverter", active: true, note: "ایمنی اینورتر و مبدل" },
  { id: "iec-61643", code: "IEC 61643", title: "Low-voltage surge protective devices", domain: "protection", active: true, note: "SPD در AC/DC" },
  { id: "iec-60947-2", code: "IEC 60947-2", title: "Low-voltage switchgear and controlgear — Circuit-breakers", domain: "protection", active: true, note: "کلید حفاظتی MCCB/CB" },
  { id: "iec-60269-6", code: "IEC 60269-6", title: "Low-voltage fuses — Solar photovoltaic systems", domain: "protection", active: true, note: "فیوز gPV" },
];

export const DEFAULT_RELEASE_STATE = {
  activeRelease: null,
  draft: { version: "ENG-1.0.0", title: "Engineering baseline", note: "", status: "draft", createdAt: "", createdBy: "" },
  history: [],
};

export const DEFAULT_ADMIN_DEFAULTS = {
  solarPanelDefaultW: 620,
  solarPanelManualW: 700,
  defaultAutonomyDays: 1,
  defaultSafetyFactor: 1.25,
  emergencyRequiredHours: 2,
  emergencySafetyFactor: 1.25,
  maxPngKb: 900,
  autoSnapshot: true,
  adminAssetHint: "برای تغییر تصویر کارت‌ها، فایل PNG را از همین پنل بارگذاری کنید یا فایل public/project-path-cards.json را ویرایش کنید.",
};

const DEFAULT_SECURITY = {
  enabled: true,
  pinHash: "1366",
  lastVerifiedAt: "",
  sessionMinutes: 60,
};

function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function write(key, value) {
  if (typeof window === "undefined") return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function normalizeDigits(value) {
  return String(value ?? "").replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)).replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(normalizeDigits(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hashPin(pin) {
  const input = normalizeDigits(pin).trim();
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  return String(Math.abs(hash));
}

export function readAdminProjectPathCards() {
  const cards = read(ADMIN_KEYS.projectPathCards, DEFAULT_PROJECT_PATH_CARDS);
  return Array.isArray(cards) ? cards.map((card, index) => ({ ...card, active: card.active !== false, order: Number(card.order || index + 1) })).sort((a,b)=>a.order-b.order) : DEFAULT_PROJECT_PATH_CARDS;
}

export function saveAdminProjectPathCards(cards) {
  const clean = Array.isArray(cards) ? cards.map((card, index) => ({
    key: String(card.key || ""),
    title: String(card.title || ""),
    description: String(card.description || ""),
    image: String(card.image || ""),
    calculationDomain: String(card.calculationDomain || card.key || ""),
    active: card.active !== false,
    order: normalizeNumber(card.order, index + 1),
  })).filter((card) => card.key && card.title) : DEFAULT_PROJECT_PATH_CARDS;
  logAdminAction("project-path-cards:update", { count: clean.length });
  maybeCreateSnapshot("ذخیره کارت‌های مسیر پروژه");
  return write(ADMIN_KEYS.projectPathCards, clean);
}


export const EQUIPMENT_GROUP_LABELS = {
  solarPanels: "پنل خورشیدی",
  solarInverters: "اینورتر خورشیدی",
  batteries: "باتری",
  emergencyPower: "برق اضطراری",
  protections: "حفاظت",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, normalizeNumber(value, min)));
}

function normalizeEquipmentItem(group, item = {}, previous = null) {
  const now = new Date().toISOString();
  const base = {
    ...item,
    id: String(item.id || `${group}-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: String(item.title || "تجهیز بدون عنوان"),
    brand: String(item.brand || ""),
    model: String(item.model || ""),
    category: String(item.category || EQUIPMENT_GROUP_LABELS[group] || group),
    active: item.active !== false,
    publishStatus: String(item.publishStatus || "draft"),
    revision: Math.max(1, normalizeNumber(item.revision, previous?.revision || 1)),
    standards: Array.isArray(item.standards) ? item.standards.filter(Boolean).map(String) : String(item.standards || "").split(",").map(v => v.trim()).filter(Boolean),
    datasheetUrl: String(item.datasheetUrl || ""),
    datasheetVersion: String(item.datasheetVersion || ""),
    country: String(item.country || ""),
    temperatureMinC: item.temperatureMinC === "" || item.temperatureMinC == null ? "" : normalizeNumber(item.temperatureMinC, -40),
    temperatureMaxC: item.temperatureMaxC === "" || item.temperatureMaxC == null ? "" : normalizeNumber(item.temperatureMaxC, 85),
    engineeringNote: String(item.engineeringNote || item.note || ""),
    createdAt: item.createdAt || previous?.createdAt || now,
    updatedAt: now,
    updatedBy: String(item.updatedBy || "admin"),
  };
  if (group === "solarPanels") {
    base.powerW = Math.max(1, normalizeNumber(item.powerW, 620));
    base.voltageV = Math.max(1, normalizeNumber(item.voltageV, 40));
    base.currentA = Math.max(0.1, normalizeNumber(item.currentA, 15));
    base.efficiency = clamp(item.efficiency, 1, 100);
  }
  if (group === "solarInverters") {
    base.powerKw = Math.max(0.1, normalizeNumber(item.powerKw, 5));
    base.dcVoltageV = Math.max(0, normalizeNumber(item.dcVoltageV, 48));
    base.mpptMinV = Math.max(0, normalizeNumber(item.mpptMinV, 120));
    base.mpptMaxV = Math.max(base.mpptMinV, normalizeNumber(item.mpptMaxV, 450));
    base.type = String(item.type || "hybrid");
    base.efficiency = item.efficiency == null || item.efficiency === "" ? "" : clamp(item.efficiency, 1, 100);
    base.pf = item.pf == null || item.pf === "" ? "" : clamp(item.pf, 0.1, 1);
  }
  if (group === "batteries") {
    base.voltageV = Math.max(1, normalizeNumber(item.voltageV, 48));
    base.capacityAh = Math.max(1, normalizeNumber(item.capacityAh, 100));
    base.chemistry = String(item.chemistry || "LiFePO4");
    const dod = normalizeNumber(item.dod, 0.8);
    base.dod = dod > 1 ? clamp(dod, 1, 100) / 100 : clamp(dod, 0.01, 1);
  }
  if (group === "emergencyPower") {
    base.powerKw = Math.max(0.1, normalizeNumber(item.powerKw, 5));
    base.batteryVoltageV = Math.max(1, normalizeNumber(item.batteryVoltageV, 48));
    base.efficiency = item.efficiency == null || item.efficiency === "" ? "" : clamp(item.efficiency, 1, 100);
  }
  if (group === "protections") {
    base.group = String(item.group || "shared");
    base.rating = String(item.rating || "");
    base.standard = String(item.standard || "IEC 60947-2");
    base.ratedCurrentA = item.ratedCurrentA === "" || item.ratedCurrentA == null ? "" : Math.max(0, normalizeNumber(item.ratedCurrentA, 0));
    base.ratedVoltageV = item.ratedVoltageV === "" || item.ratedVoltageV == null ? "" : Math.max(0, normalizeNumber(item.ratedVoltageV, 0));
    base.breakingCapacityKa = item.breakingCapacityKa === "" || item.breakingCapacityKa == null ? "" : Math.max(0, normalizeNumber(item.breakingCapacityKa, 0));
  }
  return base;
}

export function validateEquipmentItem(group, item = {}) {
  const errors = [];
  if (!String(item.title || "").trim()) errors.push("عنوان تجهیز الزامی است.");
  if (!String(item.brand || "").trim() && group !== "protections") errors.push("برند تجهیز مشخص نشده است.");
  if (group === "solarPanels") {
    if (normalizeNumber(item.powerW, 0) <= 0) errors.push("توان پنل باید بزرگ‌تر از صفر باشد.");
    if (normalizeNumber(item.voltageV, 0) <= 0) errors.push("ولتاژ پنل نامعتبر است.");
    if (normalizeNumber(item.currentA, 0) <= 0) errors.push("جریان پنل نامعتبر است.");
    const eff = normalizeNumber(item.efficiency, 0); if (eff <= 0 || eff > 100) errors.push("راندمان پنل باید بین ۰ تا ۱۰۰ درصد باشد.");
  }
  if (group === "solarInverters") {
    if (normalizeNumber(item.powerKw, 0) <= 0) errors.push("توان اینورتر نامعتبر است.");
    if (normalizeNumber(item.mpptMinV, 0) > normalizeNumber(item.mpptMaxV, 0)) errors.push("حداقل MPPT نمی‌تواند از حداکثر MPPT بیشتر باشد.");
  }
  if (group === "batteries") {
    if (normalizeNumber(item.voltageV, 0) <= 0 || normalizeNumber(item.capacityAh, 0) <= 0) errors.push("ولتاژ و ظرفیت باتری باید بزرگ‌تر از صفر باشند.");
    const dod = normalizeNumber(item.dod, 0); if (dod <= 0 || dod > 1) errors.push("DoD باید بین ۰ و ۱ باشد.");
  }
  if (group === "emergencyPower" && normalizeNumber(item.powerKw, 0) <= 0) errors.push("توان تجهیز برق اضطراری نامعتبر است.");
  if (item.temperatureMinC !== "" && item.temperatureMaxC !== "" && Number(item.temperatureMinC) > Number(item.temperatureMaxC)) errors.push("حداقل دمای کاری از حداکثر بیشتر است.");
  return errors;
}

export function validateEquipmentCatalog(catalog = {}) {
  const result = [];
  Object.keys(EQUIPMENT_GROUP_LABELS).forEach((group) => {
    const ids = new Set();
    (catalog[group] || []).forEach((item, index) => {
      const errors = validateEquipmentItem(group, item);
      if (ids.has(item.id)) errors.push("شناسه تجهیز تکراری است.");
      ids.add(item.id);
      if (errors.length) result.push({ group, index, id: item.id, title: item.title, errors });
    });
  });
  return result;
}

export function readAdminCatalog() {
  const catalog = read(ADMIN_KEYS.equipmentCatalog, DEFAULT_EQUIPMENT_CATALOG);
  return { ...DEFAULT_EQUIPMENT_CATALOG, ...(catalog || {}) };
}

export function saveAdminCatalog(catalog) {
  const current = readAdminCatalog();
  const input = { ...DEFAULT_EQUIPMENT_CATALOG, ...(catalog || {}) };
  const validation = validateEquipmentCatalog(input);
  if (validation.length) {
    const first = validation[0];
    throw new Error(`${EQUIPMENT_GROUP_LABELS[first.group] || first.group}: ${first.title || "تجهیز"} — ${first.errors[0]}`);
  }
  const merged = {};
  Object.keys(EQUIPMENT_GROUP_LABELS).forEach((group) => {
    const previousById = new Map((current[group] || []).map((item) => [item.id, item]));
    merged[group] = (input[group] || []).map((item) => {
      const previous = previousById.get(item.id);
      const normalized = normalizeEquipmentItem(group, item, previous);
      const previousComparable = previous ? JSON.stringify({ ...previous, updatedAt: undefined, history: undefined }) : "";
      const nextComparable = JSON.stringify({ ...normalized, updatedAt: undefined, history: undefined });
      const changed = !previous || previousComparable !== nextComparable;
      const history = Array.isArray(previous?.history) ? previous.history : [];
      return {
        ...normalized,
        revision: changed && previous ? Math.max(Number(previous.revision || 1) + 1, Number(normalized.revision || 1)) : Number(normalized.revision || 1),
        history: changed ? [{ at: new Date().toISOString(), by: normalized.updatedBy || "admin", action: previous ? "update" : "create", revision: changed && previous ? Number(previous.revision || 1) + 1 : Number(normalized.revision || 1) }, ...history].slice(0, 25) : history,
      };
    });
  });
  logAdminAction("equipment-catalog:update", {
    panels: merged.solarPanels?.length || 0,
    inverters: merged.solarInverters?.length || 0,
    batteries: merged.batteries?.length || 0,
    emergency: merged.emergencyPower?.length || 0,
    protections: merged.protections?.length || 0,
  });
  maybeCreateSnapshot("ذخیره بانک تجهیزات");
  return write(ADMIN_KEYS.equipmentCatalog, merged);
}

export function readAdminDefaults() {
  return { ...DEFAULT_ADMIN_DEFAULTS, ...read(ADMIN_KEYS.defaults, DEFAULT_ADMIN_DEFAULTS) };
}

export function saveAdminDefaults(defaults) {
  const merged = { ...DEFAULT_ADMIN_DEFAULTS, ...(defaults || {}) };
  logAdminAction("engineering-defaults:update", merged);
  maybeCreateSnapshot("ذخیره تنظیمات پیش‌فرض");
  return write(ADMIN_KEYS.defaults, merged);
}

export function readEngineeringRules() {
  const rules = read(ADMIN_KEYS.engineeringRules, DEFAULT_ENGINEERING_RULES);
  return { ...DEFAULT_ENGINEERING_RULES, ...(rules || {}), solar: { ...DEFAULT_ENGINEERING_RULES.solar, ...(rules?.solar || {}) }, battery: { ...DEFAULT_ENGINEERING_RULES.battery, ...(rules?.battery || {}) }, emergency: { ...DEFAULT_ENGINEERING_RULES.emergency, ...(rules?.emergency || {}) }, protection: { ...DEFAULT_ENGINEERING_RULES.protection, ...(rules?.protection || {}) }, cable: { ...DEFAULT_ENGINEERING_RULES.cable, ...(rules?.cable || {}) } };
}

export function saveEngineeringRules(rules) {
  const current = readEngineeringRules();
  const raw = { ...current, ...(rules || {}) };
  const numeric = (value, fallback) => { const parsed = Number(normalizeDigits(value)); return Number.isFinite(parsed) ? parsed : fallback; };
  const merged = {
    ...raw,
    solar: { ...current.solar, ...(raw.solar || {}), safetyFactor: numeric(raw.solar?.safetyFactor, current.solar.safetyFactor), dcAcRatioMin: numeric(raw.solar?.dcAcRatioMin, current.solar.dcAcRatioMin), dcAcRatioMax: numeric(raw.solar?.dcAcRatioMax, current.solar.dcAcRatioMax), voltageMarginPct: numeric(raw.solar?.voltageMarginPct, current.solar.voltageMarginPct), temperatureDeratingPct: numeric(raw.solar?.temperatureDeratingPct, current.solar.temperatureDeratingPct), stringCurrentFactor: numeric(raw.solar?.stringCurrentFactor, current.solar.stringCurrentFactor) },
    battery: { ...current.battery, ...(raw.battery || {}), defaultDod: numeric(raw.battery?.defaultDod, current.battery.defaultDod), roundTripEfficiency: numeric(raw.battery?.roundTripEfficiency, current.battery.roundTripEfficiency), reservePct: numeric(raw.battery?.reservePct, current.battery.reservePct), temperatureDeratingPct: numeric(raw.battery?.temperatureDeratingPct, current.battery.temperatureDeratingPct) },
    emergency: { ...current.emergency, ...(raw.emergency || {}), safetyFactor: numeric(raw.emergency?.safetyFactor, current.emergency.safetyFactor), startupMarginFactor: numeric(raw.emergency?.startupMarginFactor, current.emergency.startupMarginFactor), minimumBackupHours: numeric(raw.emergency?.minimumBackupHours, current.emergency.minimumBackupHours), reservePct: numeric(raw.emergency?.reservePct, current.emergency.reservePct) },
    protection: { ...current.protection, ...(raw.protection || {}), breakerFactor: numeric(raw.protection?.breakerFactor, current.protection.breakerFactor), fuseFactor: numeric(raw.protection?.fuseFactor, current.protection.fuseFactor), dcIsolatorFactor: numeric(raw.protection?.dcIsolatorFactor, current.protection.dcIsolatorFactor) },
    cable: { ...current.cable, ...(raw.cable || {}), maxVoltageDropDcPct: numeric(raw.cable?.maxVoltageDropDcPct, current.cable.maxVoltageDropDcPct), maxVoltageDropAcPct: numeric(raw.cable?.maxVoltageDropAcPct, current.cable.maxVoltageDropAcPct), ampacityMarginFactor: numeric(raw.cable?.ampacityMarginFactor, current.cable.ampacityMarginFactor) },
    updatedAt: new Date().toISOString(),
  };
  maybeCreateSnapshot("ذخیره قوانین مهندسی");
  write(ADMIN_KEYS.engineeringRules, merged);
  logAdminAction("engineering-rules:update", { version: merged.version, status: merged.status });
  return merged;
}

export function readEngineeringStandards() {
  const list = read(ADMIN_KEYS.standards, DEFAULT_ENGINEERING_STANDARDS);
  return Array.isArray(list) ? list : DEFAULT_ENGINEERING_STANDARDS;
}

export function saveEngineeringStandards(list) {
  const clean = (Array.isArray(list) ? list : []).map((item, index) => ({ id: String(item.id || `standard-${index+1}`), code: String(item.code || "").trim(), title: String(item.title || "").trim(), domain: String(item.domain || "shared"), active: item.active !== false, note: String(item.note || "") })).filter((item) => item.code);
  const seen = new Set();
  clean.forEach((item) => { const key = item.code.toLowerCase(); if (seen.has(key)) throw new Error(`استاندارد تکراری است: ${item.code}`); seen.add(key); });
  maybeCreateSnapshot("ذخیره استانداردهای مهندسی");
  write(ADMIN_KEYS.standards, clean);
  logAdminAction("engineering-standards:update", { count: clean.length });
  return clean;
}

export function readAdminReleases() {
  const state = read(ADMIN_KEYS.releases, DEFAULT_RELEASE_STATE);
  return { ...DEFAULT_RELEASE_STATE, ...(state || {}), draft: { ...DEFAULT_RELEASE_STATE.draft, ...(state?.draft || {}) }, history: Array.isArray(state?.history) ? state.history : [] };
}

export function saveReleaseDraft(draft) {
  const state = readAdminReleases();
  const next = { ...state, draft: { ...state.draft, ...(draft || {}), status: "draft", updatedAt: new Date().toISOString() } };
  write(ADMIN_KEYS.releases, next);
  logAdminAction("release:draft-update", { version: next.draft.version });
  return next;
}

export function validateEngineeringRelease() {
  const system = validateAdminSystem();
  const rules = readEngineeringRules();
  const standards = readEngineeringStandards();
  const catalogValidation = validateEquipmentCatalog(readAdminCatalog());
  const warnings = [...(system.warnings || [])];
  if (catalogValidation.length) warnings.push(`بانک تجهیزات ${catalogValidation.length} رکورد دارای خطای اعتبارسنجی دارد.`);
  if (!(Number(rules.solar?.safetyFactor) >= 1)) warnings.push("ضریب اطمینان خورشیدی نامعتبر است.");
  if (!(Number(rules.emergency?.safetyFactor) >= 1)) warnings.push("ضریب اطمینان برق اضطراری نامعتبر است.");
  if (Number(rules.solar?.dcAcRatioMin) > Number(rules.solar?.dcAcRatioMax)) warnings.push("حداقل DC/AC از حداکثر بزرگ‌تر است.");
  if (!(Number(rules.battery?.defaultDod) > 0 && Number(rules.battery?.defaultDod) <= 1)) warnings.push("DoD باتری باید بین 0 و 1 باشد.");
  if (!(Number(rules.cable?.maxVoltageDropDcPct) > 0 && Number(rules.cable?.maxVoltageDropAcPct) > 0)) warnings.push("افت ولتاژ مجاز کابل نامعتبر است.");
  if (!standards.some((item) => item.active !== false && item.domain === "protection")) warnings.push("استاندارد فعال برای حفاظت تعریف نشده است.");
  return { ok: warnings.length === 0, warnings, checkedAt: new Date().toISOString(), ruleVersion: rules.version, activeStandards: standards.filter((item) => item.active !== false).length, equipmentValidationErrors: catalogValidation.length };
}

function getEquipmentReleaseStamp(catalog = readAdminCatalog()) {
  const items = Object.values(catalog || {}).flatMap((group) => Array.isArray(group) ? group : []);
  const maxRevision = items.reduce((max, item) => Math.max(max, Number(item?.revision || 1)), 1);
  return `CMS-${items.length}-R${maxRevision}`;
}

export function publishEngineeringRelease({ version, title, note = "", actor = "admin" } = {}) {
  const validation = validateEngineeringRelease();
  if (!validation.ok) throw new Error(`انتشار متوقف شد: ${validation.warnings[0]}`);
  const state = readAdminReleases();
  const now = new Date().toISOString();
  const publishedRules = saveEngineeringRules({ ...readEngineeringRules(), status: "published", publishedAt: now });
  const release = { id: `release-${Date.now()}`, version: String(version || state.draft.version || "ENG-1.0.0"), title: String(title || state.draft.title || "Engineering release"), note: String(note || state.draft.note || ""), status: "published", publishedAt: now, publishedBy: actor, ruleVersion: publishedRules.version, equipmentVersion: getEquipmentReleaseStamp(), standards: readEngineeringStandards().filter((item) => item.active !== false).map((item) => item.code), validation };
  const next = { activeRelease: release, draft: { ...state.draft, version: release.version, title: release.title, note: "", status: "draft", updatedAt: now }, history: [release, ...state.history].slice(0, 30) };
  maybeCreateSnapshot(`انتشار ${release.version}`);
  write(ADMIN_KEYS.releases, next);
  write(ADMIN_KEYS.version, release.version);
  logAdminAction("release:publish", { version: release.version, ruleVersion: release.ruleVersion, equipmentVersion: release.equipmentVersion });
  return next;
}

export function getActiveEngineeringRelease() { return readAdminReleases().activeRelease; }

export function getEngineeringRuntimeConfig() {
  return { rules: readEngineeringRules(), standards: readEngineeringStandards().filter((item) => item.active !== false), release: getActiveEngineeringRelease() };
}

export function readAdminAuditLog() { return read(ADMIN_KEYS.auditLog, []); }

export function logAdminAction(type, payload = {}) {
  if (typeof window === "undefined") return [];
  const current = readAdminAuditLog();
  const next = [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, payload, at: new Date().toISOString(), version: ADMIN_SYSTEM_VERSION }, ...current].slice(0, 160);
  write(ADMIN_KEYS.auditLog, next);
  return next;
}

export function readAdminSecurity() { return { ...DEFAULT_SECURITY, ...read(ADMIN_KEYS.security, DEFAULT_SECURITY) }; }

export function isAdminPinVerified() {
  const security = readAdminSecurity();
  if (!security.enabled) return true;
  const last = security.lastVerifiedAt ? new Date(security.lastVerifiedAt).getTime() : 0;
  return last && Date.now() - last < Number(security.sessionMinutes || 60) * 60 * 1000;
}

export function verifyAdminPin(pin) {
  const security = readAdminSecurity();
  const defaultHash = hashPin("1366");
  const expected = security.pinHash === "1366" ? defaultHash : security.pinHash;
  if (hashPin(pin) !== expected) {
    logAdminAction("admin-security:pin-failed", {});
    return false;
  }
  write(ADMIN_KEYS.security, { ...security, pinHash: expected, lastVerifiedAt: new Date().toISOString() });
  logAdminAction("admin-security:pin-verified", {});
  return true;
}

export function changeAdminPin(nextPin) {
  const clean = normalizeDigits(nextPin).trim();
  if (clean.length < 4) throw new Error("رمز ادمین باید حداقل ۴ رقم باشد.");
  const security = readAdminSecurity();
  write(ADMIN_KEYS.security, { ...security, pinHash: hashPin(clean), lastVerifiedAt: new Date().toISOString() });
  logAdminAction("admin-security:pin-changed", {});
}

export function readAdminSnapshots() { return read(ADMIN_KEYS.snapshots, []); }

export function createAdminSnapshot(label = "Snapshot") {
  const snapshot = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, label, at: new Date().toISOString(), config: exportAdminJson(false) };
  const next = [snapshot, ...readAdminSnapshots()].slice(0, 20);
  write(ADMIN_KEYS.snapshots, next);
  logAdminAction("admin-snapshot:create", { label });
  return next;
}

export function restoreAdminSnapshot(id) {
  const snapshot = readAdminSnapshots().find((item) => item.id === id);
  if (!snapshot) throw new Error("نسخه پشتیبان پیدا نشد.");
  importAdminJson(snapshot.config);
  logAdminAction("admin-snapshot:restore", { id, label: snapshot.label });
  return snapshot;
}

function maybeCreateSnapshot(label) {
  const defaults = readAdminDefaults();
  if (defaults.autoSnapshot !== false) {
    const snapshots = readAdminSnapshots();
    const last = snapshots[0]?.at ? new Date(snapshots[0].at).getTime() : 0;
    if (!last || Date.now() - last > 15000) createAdminSnapshot(label);
  }
}

export function validateAdminSystem() {
  const cards = readAdminProjectPathCards();
  const catalog = readAdminCatalog();
  const defaults = readAdminDefaults();
  const warnings = [];
  if (!cards.some((card) => card.key === "solar" && card.active !== false)) warnings.push("کارت مسیر خورشیدی فعال نیست.");
  if (!cards.some((card) => card.key === "emergency" && card.active !== false)) warnings.push("کارت مسیر برق اضطراری فعال نیست.");
  if (Number(defaults.solarPanelDefaultW) !== 620) warnings.push("پنل پیش‌فرض خورشیدی روی ۶۲۰ وات نیست.");
  if (!catalog.solarPanels?.some((item) => item.active !== false && Number(item.powerW) === 620)) warnings.push("بانک پنل فعال ۶۲۰ وات ندارد.");
  if (!catalog.emergencyPower?.some((item) => item.active !== false)) warnings.push("بانک تجهیزات برق اضطراری آیتم فعال ندارد.");
  if (String(JSON.stringify(catalog)).toLowerCase().includes("ups")) warnings.push("در بانک برق اضطراری عبارت UPS دیده شد؛ در UI نباید نمایش داده شود.");
  return { ok: warnings.length === 0, warnings, checkedAt: new Date().toISOString(), version: ADMIN_SYSTEM_VERSION };
}

export function resetAdminSystem() {
  saveAdminProjectPathCards(DEFAULT_PROJECT_PATH_CARDS);
  saveAdminCatalog(DEFAULT_EQUIPMENT_CATALOG);
  saveAdminDefaults(DEFAULT_ADMIN_DEFAULTS);
  saveEngineeringRules(DEFAULT_ENGINEERING_RULES);
  saveEngineeringStandards(DEFAULT_ENGINEERING_STANDARDS);
  write(ADMIN_KEYS.releases, DEFAULT_RELEASE_STATE);
  logAdminAction("admin-system:reset", {});
}

export function exportAdminJson(includeAudit = true) {
  return {
    version: ADMIN_SYSTEM_VERSION,
    exportedAt: new Date().toISOString(),
    projectPathCards: readAdminProjectPathCards(),
    equipmentCatalog: readAdminCatalog(),
    defaults: readAdminDefaults(),
    engineeringRules: readEngineeringRules(),
    engineeringStandards: readEngineeringStandards(),
    releases: readAdminReleases(),
    validation: validateAdminSystem(),
    releaseValidation: validateEngineeringRelease(),
    ...(includeAudit ? { auditLog: readAdminAuditLog(), snapshots: readAdminSnapshots() } : {}),
  };
}

export function importAdminJson(config) {
  if (!config || typeof config !== "object") throw new Error("فایل تنظیمات معتبر نیست.");
  if (config.projectPathCards) saveAdminProjectPathCards(config.projectPathCards);
  if (config.equipmentCatalog) saveAdminCatalog(config.equipmentCatalog);
  if (config.defaults) saveAdminDefaults(config.defaults);
  if (config.engineeringRules) saveEngineeringRules(config.engineeringRules);
  if (config.engineeringStandards) saveEngineeringStandards(config.engineeringStandards);
  if (config.releases) write(ADMIN_KEYS.releases, config.releases);
  if (Array.isArray(config.auditLog)) write(ADMIN_KEYS.auditLog, config.auditLog.slice(0, 160));
  if (Array.isArray(config.snapshots)) write(ADMIN_KEYS.snapshots, config.snapshots.slice(0, 20));
  write(ADMIN_KEYS.version, ADMIN_SYSTEM_VERSION);
  logAdminAction("admin-config:import", { version: config.version || "unknown" });
}

export async function fileToDataUrl(file, maxKb = readAdminDefaults().maxPngKb) {
  if (!file) return "";
  if (file.type !== "image/png") throw new Error("فقط فایل PNG برای تصویر مسیر پروژه مجاز است.");
  const maxBytes = Number(maxKb || 900) * 1024;
  if (file.size > maxBytes) throw new Error(`حجم تصویر PNG باید کمتر از ${maxKb} کیلوبایت باشد.`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.readAsDataURL(file);
  });
}

