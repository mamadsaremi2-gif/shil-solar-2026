const ADMIN_KEYS = {
  projectPathCards: "shil:admin:projectPathCards",
  equipmentCatalog: "shil:admin:equipmentCatalog",
  defaults: "shil:admin:defaults",
  auditLog: "shil:admin:auditLog",
  snapshots: "shil:admin:snapshots",
  security: "shil:admin:security",
  version: "shil:admin:version",
};

export const ADMIN_SYSTEM_VERSION = "SHIL_ADMIN_SYSTEM_100_V2";

export const DEFAULT_PROJECT_PATH_CARDS = [
  {
    key: "solar",
    title: "اجرای پروژه با پنل خورشیدی",
    description: "طراحی سیستم خورشیدی با پنل، باتری، اینورتر و حفاظت",
    image: "/assets/shil/execution/solar-execution.png",
    calculationDomain: "solar",
    active: true,
    order: 1,
  },
  {
    key: "emergency",
    title: "اجرای پروژه با برق اضطراری",
    description: "طراحی سیستم پشتیبان با اینورتر و باتری",
    image: "/assets/shil/execution/emergency-inverter-battery.png",
    calculationDomain: "emergency",
    active: true,
    order: 2,
  },
  {
    key: "future",
    title: "توسعه",
    description: "در حال توسعه",
    image: "/assets/shil/execution/future.png",
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

export function readAdminCatalog() {
  const catalog = read(ADMIN_KEYS.equipmentCatalog, DEFAULT_EQUIPMENT_CATALOG);
  return { ...DEFAULT_EQUIPMENT_CATALOG, ...(catalog || {}) };
}

export function saveAdminCatalog(catalog) {
  const merged = { ...DEFAULT_EQUIPMENT_CATALOG, ...(catalog || {}) };
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
  logAdminAction("admin-system:reset", {});
}

export function exportAdminJson(includeAudit = true) {
  return {
    version: ADMIN_SYSTEM_VERSION,
    exportedAt: new Date().toISOString(),
    projectPathCards: readAdminProjectPathCards(),
    equipmentCatalog: readAdminCatalog(),
    defaults: readAdminDefaults(),
    validation: validateAdminSystem(),
    ...(includeAudit ? { auditLog: readAdminAuditLog(), snapshots: readAdminSnapshots() } : {}),
  };
}

export function importAdminJson(config) {
  if (!config || typeof config !== "object") throw new Error("فایل تنظیمات معتبر نیست.");
  if (config.projectPathCards) saveAdminProjectPathCards(config.projectPathCards);
  if (config.equipmentCatalog) saveAdminCatalog(config.equipmentCatalog);
  if (config.defaults) saveAdminDefaults(config.defaults);
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
