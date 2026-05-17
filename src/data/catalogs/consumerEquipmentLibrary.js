const categories = [
  "روشنایی", "سرمایش", "گرمایش", "آشپزخانه", "اداری", "شبکه", "امنیتی", "صنعتی", "پمپ", "کشاورزی",
  "درمانی", "فروشگاهی", "کارگاهی", "مخابراتی", "عمومی"
];

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

export const consumerEquipmentLibrary = Array.from({ length: 250 }, (_, i) => {
  const base = baseItems[i % baseItems.length];
  const group = Math.floor(i / baseItems.length) + 1;
  const powerScale = [1, 1.15, 1.3, 0.85, 1.5][group % 5];
  const hoursScale = [1, 0.75, 1.25, 0.5, 1.5][group % 5];
  const ratedPowerW = Math.round(base[1] * powerScale);
  const usageHoursPerDay = Number(Math.min(24, Math.max(0.2, base[2] * hoursScale)).toFixed(1));
  const diversityFactor = base[5] === "heavy" ? 0.75 : base[5] === "medium" ? 0.85 : 0.95;
  const energyDailyWh = Math.round(ratedPowerW * usageHoursPerDay * diversityFactor);
  return {
    id: `eq-${String(i + 1).padStart(3, "0")}`,
    title: `${base[0]} ${group > 1 ? `مدل ${group}` : ""}`.trim(),
    category: categories[i % categories.length],
    class: base[5],
    ratedPowerW,
    defaultPowerW: ratedPowerW,
    usageHoursPerDay,
    diversityFactor,
    simultaneityFactor: diversityFactor,
    powerFactor: base[3] > 1.7 ? 0.82 : base[5] === "heavy" ? 0.88 : 0.95,
    startupFactor: base[3],
    surgeFactor: base[3],
    motorStartCurrentFactor: base[3] > 1.7 ? 1.7 : 1,
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

export function searchConsumerEquipment(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return consumerEquipmentLibrary;
  return consumerEquipmentLibrary.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.priority.toLowerCase().includes(q) ||
    item.class.toLowerCase().includes(q)
  );
}
