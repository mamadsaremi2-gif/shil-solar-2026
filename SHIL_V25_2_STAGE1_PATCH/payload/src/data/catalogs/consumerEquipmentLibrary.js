import { getCachedRuntimeData, loadRuntimeDataKey, RUNTIME_KEYS, saveRuntimeAppData } from "../../services/runtimeAppDataService.js";
export const CONSUMER_CATEGORY_ORDER = [
  "سرمایش", "گرمایش", "روشنایی", "صوتی و تصویری", "آشپزخانه", "لوازم خانگی", "اداری", "شبکه و مخابرات",
  "امنیتی", "پمپ و موتور", "صنعتی و کارگاهی", "کشاورزی", "درمانی", "فروشگاهی", "متفرقه"
];

const categories = CONSUMER_CATEGORY_ORDER;

export function inferConsumerCategory(item = {}) {
  const title = `${item.baseTitle || ""} ${item.title || ""}`.toLowerCase();
  const current = String(item.category || "").trim();
  const customRecord = item.id && !String(item.id).startsWith("eq-");
  if (customRecord && CONSUMER_CATEGORY_ORDER.includes(current)) return current;

  const rules = [
    ["سرمایش", ["کولر", "چیلر", "فن", "سردخانه", "فریزر", "تهویه"]],
    ["گرمایش", ["هیتر", "گرمایش", "پکیج", "آبگرمکن", "بخاری"]],
    ["روشنایی", ["لامپ", "روشنایی", "چراغ", "پروژکتور"]],
    ["صوتی و تصویری", ["تلویزیون", "اسپیکر", "آمپلی", "ویدئو", "نمایشگر", "مانیتور"]],
    ["آشپزخانه", ["مایکروویو", "چای ساز", "چای‌ساز", "ظرفشویی", "اجاق", "فر"]],
    ["لوازم خانگی", ["یخچال", "لباسشویی", "جاروبرقی", "شارژر موبایل"]],
    ["اداری", ["لپ تاپ", "لپ‌تاپ", "کامپیوتر", "پرینتر", "pos", "کارتخوان"]],
    ["شبکه و مخابرات", ["مودم", "روتر", "سرور", "شبکه", "مخابرات"]],
    ["امنیتی", ["دوربین", "nvr", "اعلام حریق", "سنسور", "امنیت"]],
    ["پمپ و موتور", ["پمپ", "کفکش", "موتور", "کمپرسور"]],
    ["صنعتی و کارگاهی", ["جوش", "دریل", "فرز", "ابزار", "تابلو فرمان", "صنعت"]],
    ["کشاورزی", ["کشاورز", "آبیاری"]],
    ["درمانی", ["دارویی", "اکسیژن", "پزشک", "درمان"]],
    ["فروشگاهی", ["فروشگاه", "ترازو", "کرکره", "درب اتوماتیک"]],
  ];
  for (const [category, keywords] of rules) {
    if (keywords.some((keyword) => title.includes(keyword))) return category;
  }
  return CONSUMER_CATEGORY_ORDER.includes(current) && current !== "عمومی" ? current : "متفرقه";
}


const baseItems = [
  ["لامپ LED", 12, 6, 1, "night", "light"], ["پنل روشنایی LED", 45, 8, 1, "night", "light"], ["یخچال خانگی", 180, 12, 1.8, "mixed", "medium"],
  ["فریزر", 220, 12, 1.8, "mixed", "medium"], ["تلویزیون LED", 120, 5, 1.1, "evening", "light"], ["مودم اینترنت", 15, 24, 1, "mixed", "light"],
  ["روتر شبکه", 25, 24, 1, "mixed", "light"], ["لپ تاپ", 90, 6, 1, "day", "light"], ["کامپیوتر اداری", 250, 8, 1.2, "day", "medium"],
  ["پرینتر", 500, 1, 1.5, "day", "medium"], ["دوربین مداربسته", 12, 24, 1, "mixed", "light"], ["NVR", 60, 24, 1.1, "mixed", "medium"],
  ["کولر آبی", 650, 8, 2.2, "day", "medium"], ["کولر گازی 12000", 1200, 8, 3.2, "day", "heavy"], ["کولر گازی 24000", 2400, 8, 3.5, "day", "heavy"],
  ["فن تهویه", 120, 10, 1.8, "day", "medium"], ["هیتر برقی", 2000, 4, 1.1, "night", "heavy"], ["پکیج/کنترلر گرمایش", 180, 6, 1.4, "night", "medium"],
  ["مایکروویو", 1200, 0.5, 1.2, "noon", "heavy"], ["چای ساز", 1800, 0.7, 1.1, "morning", "heavy"], ["ماشین لباسشویی", 900, 1.5, 2.5, "day", "heavy"],
  ["پمپ آب نیم اسب", 370, 2, 3.2, "mixed", "medium"], ["پمپ آب یک اسب", 750, 2, 3.5, "mixed", "heavy"], ["پمپ کفکش", 1100, 3, 3.5, "day", "heavy"],
  ["یخچال فروشگاهی", 450, 16, 2.3, "mixed", "heavy"], ["کرکره برقی", 450, 0.3, 2.8, "day", "medium"], ["درب اتوماتیک", 350, 0.5, 2.2, "day", "medium"],
  ["سرور رک", 600, 24, 1.2, "mixed", "heavy"], ["سیستم پشتیبان باتری و اینورتر شبکه", 300, 24, 1.1, "mixed", "medium"], ["دستگاه POS", 18, 12, 1, "day", "light"],
  ["روشنایی اضطراری", 30, 8, 1, "night", "light"], ["دستگاه جوش سبک", 3500, 1, 2, "day", "heavy"], ["کمپرسور هوا", 2200, 2, 3.5, "day", "heavy"],
  ["دریل برقی", 700, 1, 1.8, "day", "medium"], ["فرز سنگبری", 1800, 1, 2.1, "day", "heavy"], ["ترازوی دیجیتال", 25, 10, 1, "day", "light"],
  ["دستگاه کارتخوان", 12, 10, 1, "day", "light"], ["یخچال دارویی", 250, 24, 1.8, "mixed", "heavy"], ["اکسیژن ساز", 450, 8, 1.5, "mixed", "heavy"],
  ["مانیتور", 40, 8, 1, "day", "light"], ["اسپیکر/آمپلی‌فایر", 250, 3, 1.5, "evening", "medium"], ["آبگرمکن برقی", 2500, 2, 1.1, "morning", "heavy"],
  ["ماشین ظرفشویی", 1500, 1.5, 1.8, "night", "heavy"], ["جاروبرقی", 1600, 0.5, 1.5, "day", "heavy"], ["شارژر موبایل", 20, 4, 1, "evening", "light"],
  ["شارژر ابزار", 180, 2, 1.2, "day", "light"], ["روشنایی محوطه", 80, 10, 1, "night", "medium"], ["تابلو فرمان", 120, 24, 1.2, "mixed", "medium"],
  ["سنسور و کنترلر", 20, 24, 1, "mixed", "light"], ["سیستم اعلام حریق", 50, 24, 1, "mixed", "medium"], ["دستگاه تصفیه آب", 90, 4, 1.6, "day", "medium"]
];

export const DEFAULT_CONSUMER_EQUIPMENT_LIBRARY = Array.from({ length: 250 }, (_, i) => {
  const base = baseItems[i % baseItems.length];
  const group = Math.floor(i / baseItems.length) + 1;
  const variantProfiles = [
    { powerScale: 1.00, hoursScale: 1.00, label: "استاندارد" },
    { powerScale: 1.15, hoursScale: 0.75, label: "پرتوان" },
    { powerScale: 1.30, hoursScale: 1.25, label: "سنگین" },
    { powerScale: 0.85, hoursScale: 0.50, label: "کم مصرف" },
    { powerScale: 1.50, hoursScale: 1.50, label: "صنعتی" },
  ];
  const variant = variantProfiles[(group - 1) % variantProfiles.length];
  const powerScale = variant.powerScale;
  const hoursScale = variant.hoursScale;
  const ratedPowerW = Math.round(base[1] * powerScale);
  const usageHoursPerDay = Number(Math.min(24, Math.max(0.2, base[2] * hoursScale)).toFixed(1));
  const diversityFactor = base[5] === "heavy" ? 0.75 : base[5] === "medium" ? 0.85 : 0.95;
  const energyDailyWh = Math.round(ratedPowerW * usageHoursPerDay * diversityFactor);
  return {
    id: `eq-${String(i + 1).padStart(3, "0")}`,
    title: `${base[0]} - ${variant.label} (${ratedPowerW}W)`,
    baseTitle: base[0],
    variantLabel: variant.label,
    category: inferConsumerCategory({ id: `eq-${String(i + 1).padStart(3, "0")}`, baseTitle: base[0], title: base[0] }),
    class: base[5],
    ratedPowerW,
    defaultPowerW: ratedPowerW,
    usageHoursPerDay,
    diversityFactor,
    simultaneityFactor: diversityFactor,
    powerFactor: base[3] > 1.7 ? 0.82 : base[5] === "heavy" ? 0.88 : 0.95,
    efficiency: 1,
    startupFactor: base[3],
    surgeFactor: base[3],
    motorStartCurrentFactor: base[3] > 1.7 ? 2.5 : 1,
    softStarterFactor: base[3] > 1.7 ? 1.2 : 1,
    hasSoftStarter: false,
    energyDailyWh,
    energyDailyKWh: Number((energyDailyWh / 1000).toFixed(2)),
    voltage: i % 17 === 0 ? 380 : 220,
    phase: i % 17 === 0 ? "three" : "single",
    type: base[3] > 1.7 ? "inductive" : "resistive/electronic",
    profile: base[4],
    priority: ["حیاتی", "مهم", "عادی", "قابل حذف"][i % 4],
  };
});

function normalizeList(list) {
  return (Array.isArray(list) ? list : []).map((item, index) => ({
    ...item,
    id: String(item.id || `consumer-${Date.now()}-${index}`),
    title: String(item.title || item.baseTitle || "مصرف‌کننده بدون عنوان"),
    baseTitle: String(item.baseTitle || item.title || ""),
    category: inferConsumerCategory(item),
    ratedPowerW: Number(item.ratedPowerW ?? item.defaultPowerW ?? 0) || 0,
    defaultPowerW: Number(item.defaultPowerW ?? item.ratedPowerW ?? 0) || 0,
    usageHoursPerDay: Number(item.usageHoursPerDay ?? item.defaultHours ?? 1) || 0,
    diversityFactor: Number(item.diversityFactor ?? item.simultaneityFactor ?? 1) || 1,
    simultaneityFactor: Number(item.simultaneityFactor ?? item.diversityFactor ?? 1) || 1,
    powerFactor: Number(item.powerFactor ?? 0.95) || 0.95,
    efficiency: Number(item.efficiency ?? 1) || 1,
    startupFactor: Number(item.startupFactor ?? item.surgeFactor ?? 1) || 1,
    surgeFactor: Number(item.surgeFactor ?? item.startupFactor ?? 1) || 1,
    voltage: Number(item.voltage ?? 220) || 220,
    phase: item.phase === "three" ? "three" : "single",
    type: String(item.type || ((Number(item.startupFactor ?? item.surgeFactor ?? 1) > 1.7) ? "inductive" : "resistive/electronic")),
    profile: String(item.profile || "mixed"),
    priority: String(item.priority || "عادی"),
    active: item.active !== false,
    publishStatus: String(item.publishStatus || "published"),
  }));
}

function isPublicConsumerEquipment(item) {
  return item.active !== false && String(item.publishStatus || "published") === "published";
}

function mergeConsumerEquipmentWithBaseline(runtimeList) {
  const baseline = normalizeList(DEFAULT_CONSUMER_EQUIPMENT_LIBRARY);
  const runtime = normalizeList(runtimeList);
  if (!runtime.length) return baseline;

  const merged = new Map(baseline.map((item) => [item.id, item]));
  runtime.forEach((item) => {
    const base = merged.get(item.id);
    merged.set(item.id, base ? { ...base, ...item } : item);
  });
  return Array.from(merged.values());
}

function baselineNeedsPersistence(runtimeList, mergedList) {
  const runtimeIds = new Set(normalizeList(runtimeList).map((item) => item.id));
  const missingBaseline = DEFAULT_CONSUMER_EQUIPMENT_LIBRARY.some((item) => !runtimeIds.has(item.id));
  return missingBaseline || normalizeList(runtimeList).length !== mergedList.length;
}

export function getConsumerEquipmentLibrary(options = {}) {
  const cached = getCachedRuntimeData(RUNTIME_KEYS.consumerEquipment, null);
  const list = mergeConsumerEquipmentWithBaseline(cached);
  return options.includeUnpublished ? list : list.filter(isPublicConsumerEquipment);
}

export const consumerEquipmentLibrary = DEFAULT_CONSUMER_EQUIPMENT_LIBRARY;

export async function loadConsumerEquipmentLibrary(options = {}) {
  const runtimeList = await loadRuntimeDataKey(RUNTIME_KEYS.consumerEquipment, []);
  const merged = mergeConsumerEquipmentWithBaseline(runtimeList);

  if (options.persistBaseline && baselineNeedsPersistence(runtimeList, merged)) {
    try {
      await saveRuntimeAppData(RUNTIME_KEYS.consumerEquipment, merged);
    } catch (error) {
      console.warn("SHIL consumer baseline persistence:", error?.message || error);
    }
  }

  return options.includeUnpublished ? merged : merged.filter(isPublicConsumerEquipment);
}

export async function saveConsumerEquipmentLibrary(list) {
  const normalized = normalizeList(list);
  await saveRuntimeAppData(RUNTIME_KEYS.consumerEquipment, normalized);
  return normalized;
}

export function searchConsumerEquipment(query = "", source = getConsumerEquipmentLibrary()) {
  const q = String(query || "").trim().toLowerCase();
  const list = normalizeList(source).filter(isPublicConsumerEquipment);
  if (!q) return list;
  return list.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.priority.toLowerCase().includes(q) ||
    item.class.toLowerCase().includes(q) ||
    String(item.brand || "").toLowerCase().includes(q) ||
    String(item.model || "").toLowerCase().includes(q)
  );
}
