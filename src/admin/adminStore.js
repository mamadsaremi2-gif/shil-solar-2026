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
    title: "پروژه برق خورشیدی با پنل", description: "طراحی سیستم خورشیدی، پنل، اینورتر و باتری برای تامین انرژی", image: "/assets/shil/execution/solar-execution.png",
    calculationDomain: "solar",
    active: true,
    order: 1,
  },
  {
    key: "emergency",
    title: "برق اضطراری", description: "طراحی برق اضطراری با اینورتر و باتری برای پشتیبانی مصرف", image: "/assets/shil/execution/emergency-inverter-battery.png",
    calculationDomain: "emergency",
    active: true,
    order: 2,
  },
  {
    key: "future",
    title: "ØªÙˆØ³Ø¹Ù‡",
    description: "Ø¯Ø± Ø­Ø§Ù„ ØªÙˆØ³Ø¹Ù‡",
    image: "/assets/shil/execution/future.svg",
    calculationDomain: "future",
    active: true,
    order: 3,
  },
];

export const DEFAULT_EQUIPMENT_CATALOG = {
  solarPanels: [
    { id: "panel-620", title: "Ù¾Ù†Ù„ Ù…ÙˆÙ†Ùˆ Û¶Û²Û° ÙˆØ§Øª", brand: "SHIL Standard", powerW: 620, voltageV: 41.2, currentA: 15.05, efficiency: 22.4, active: true, note: "Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…ÙˆØªÙˆØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" },
    { id: "panel-700", title: "Ù¾Ù†Ù„ Ù…ÙˆÙ†Ùˆ Û·Û°Û° ÙˆØ§Øª", brand: "SHIL Manual", powerW: 700, voltageV: 42.8, currentA: 16.36, efficiency: 22.8, active: true, note: "Ú¯Ø²ÛŒÙ†Ù‡ Ø¯Ø³ØªÛŒ Ú©Ø§Ø±Ø¨Ø±" },
  ],
  solarInverters: [
    { id: "inv-offgrid-5", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø¢ÙÚ¯Ø±ÛŒØ¯ Ûµ Ú©ÛŒÙ„ÙˆÙˆØ§Øª", brand: "SHIL Standard", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "offgrid", active: true },
    { id: "inv-hybrid-5", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ù‡ÛŒØ¨Ø±ÛŒØ¯ Ûµ Ú©ÛŒÙ„ÙˆÙˆØ§Øª", brand: "SHIL Standard", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "hybrid", active: true },
    { id: "inv-ongrid-6", title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø¢Ù†Ú¯Ø±ÛŒØ¯ Û¶ Ú©ÛŒÙ„ÙˆÙˆØ§Øª", brand: "SHIL Standard", powerKw: 6, dcVoltageV: 0, mpptMinV: 150, mpptMaxV: 850, type: "ongrid", active: true },
  ],
  batteries: [
    { id: "bat-lfp-48-100", title: "Ø¨Ø§ØªØ±ÛŒ LiFePO4 48V 100Ah", brand: "SHIL Standard", voltageV: 48, capacityAh: 100, chemistry: "LiFePO4", dod: 0.8, active: true },
    { id: "bat-lfp-24-200", title: "Ø¨Ø§ØªØ±ÛŒ LiFePO4 24V 200Ah", brand: "SHIL Standard", voltageV: 24, capacityAh: 200, chemistry: "LiFePO4", dod: 0.8, active: true },
  ],
  emergencyPower: [
    { id: "ep-3k", title: "Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Û³ Ú©ÛŒÙ„ÙˆÙˆØ§Øª", brand: "SHIL Standard", powerKw: 3, batteryVoltageV: 48, active: true, note: "Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø³Ø¨Ú©" },
    { id: "ep-5k", title: "Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ûµ Ú©ÛŒÙ„ÙˆÙˆØ§Øª", brand: "SHIL Standard", powerKw: 5, batteryVoltageV: 48, active: true, note: "Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ù…ØªÙˆØ³Ø·" },
  ],
  protections: [
    { id: "prot-dc-spd", title: "SPD Ø³Ù…Øª DC", group: "solar", rating: "Type II", active: true },
    { id: "prot-ac-mcb", title: "Ú©Ù„ÛŒØ¯ Ù…ÛŒÙ†ÛŒØ§ØªÙˆØ±ÛŒ AC", group: "shared", rating: "C Curve", active: true },
    { id: "prot-earth", title: "Ø³ÛŒØ³ØªÙ… Ø§Ø±Øª Ø­ÙØ§Ø¸ØªÛŒ", group: "shared", rating: "Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø§Ø¬Ø±Ø§ÛŒÛŒ", active: true },
    { id: "prot-emergency-bypass", title: "Ú©Ù„ÛŒØ¯ Ø¨Ø§ÛŒâ€ŒÙ¾Ø³ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", group: "emergency", rating: "Manual Bypass", active: true },
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
  adminAssetHint: "Ø¨Ø±Ø§ÛŒ ØªØºÛŒÛŒØ± ØªØµÙˆÛŒØ± Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ØŒ ÙØ§ÛŒÙ„ PNG Ø±Ø§ Ø§Ø² Ù‡Ù…ÛŒÙ† Ù¾Ù†Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ú©Ù†ÛŒØ¯ ÛŒØ§ ÙØ§ÛŒÙ„ public/project-path-cards.json Ø±Ø§ ÙˆÛŒØ±Ø§ÛŒØ´ Ú©Ù†ÛŒØ¯.",
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
  return String(value ?? "").replace(/[Û°-Û¹]/g, (digit) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(digit)).replace(/[Ù -Ù©]/g, (digit) => "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(digit));
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
  maybeCreateSnapshot("Ø°Ø®ÛŒØ±Ù‡ Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡");
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
  maybeCreateSnapshot("Ø°Ø®ÛŒØ±Ù‡ Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª");
  return write(ADMIN_KEYS.equipmentCatalog, merged);
}

export function readAdminDefaults() {
  return { ...DEFAULT_ADMIN_DEFAULTS, ...read(ADMIN_KEYS.defaults, DEFAULT_ADMIN_DEFAULTS) };
}

export function saveAdminDefaults(defaults) {
  const merged = { ...DEFAULT_ADMIN_DEFAULTS, ...(defaults || {}) };
  logAdminAction("engineering-defaults:update", merged);
  maybeCreateSnapshot("Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶");
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
  if (clean.length < 4) throw new Error("Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ† Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û´ Ø±Ù‚Ù… Ø¨Ø§Ø´Ø¯.");
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
  if (!snapshot) throw new Error("Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
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
  if (!cards.some((card) => card.key === "solar" && card.active !== false)) warnings.push("Ú©Ø§Ø±Øª Ù…Ø³ÛŒØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ ÙØ¹Ø§Ù„ Ù†ÛŒØ³Øª.");
  if (!cards.some((card) => card.key === "emergency" && card.active !== false)) warnings.push("Ú©Ø§Ø±Øª Ù…Ø³ÛŒØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ ÙØ¹Ø§Ù„ Ù†ÛŒØ³Øª.");
  if (Number(defaults.solarPanelDefaultW) !== 620) warnings.push("Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø±ÙˆÛŒ Û¶Û²Û° ÙˆØ§Øª Ù†ÛŒØ³Øª.");
  if (!catalog.solarPanels?.some((item) => item.active !== false && Number(item.powerW) === 620)) warnings.push("Ø¨Ø§Ù†Ú© Ù¾Ù†Ù„ ÙØ¹Ø§Ù„ Û¶Û²Û° ÙˆØ§Øª Ù†Ø¯Ø§Ø±Ø¯.");
  if (!catalog.emergencyPower?.some((item) => item.active !== false)) warnings.push("Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¢ÛŒØªÙ… ÙØ¹Ø§Ù„ Ù†Ø¯Ø§Ø±Ø¯.");
  if (String(JSON.stringify(catalog)).toLowerCase().includes("ups")) warnings.push("Ø¯Ø± Ø¨Ø§Ù†Ú© Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¹Ø¨Ø§Ø±Øª UPS Ø¯ÛŒØ¯Ù‡ Ø´Ø¯Ø› Ø¯Ø± UI Ù†Ø¨Ø§ÛŒØ¯ Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ø´ÙˆØ¯.");
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
  if (!config || typeof config !== "object") throw new Error("ÙØ§ÛŒÙ„ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª.");
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
  if (file.type !== "image/png") throw new Error("ÙÙ‚Ø· ÙØ§ÛŒÙ„ PNG Ø¨Ø±Ø§ÛŒ ØªØµÙˆÛŒØ± Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ Ù…Ø¬Ø§Ø² Ø§Ø³Øª.");
  const maxBytes = Number(maxKb || 900) * 1024;
  if (file.size > maxBytes) throw new Error(`Ø­Ø¬Ù… ØªØµÙˆÛŒØ± PNG Ø¨Ø§ÛŒØ¯ Ú©Ù…ØªØ± Ø§Ø² ${maxKb} Ú©ÛŒÙ„ÙˆØ¨Ø§ÛŒØª Ø¨Ø§Ø´Ø¯.`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Ø®ÙˆØ§Ù†Ø¯Ù† ØªØµÙˆÛŒØ± Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯."));
    reader.readAsDataURL(file);
  });
}

