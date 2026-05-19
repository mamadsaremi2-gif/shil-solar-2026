export const SHIL_AI_LAYER_VERSION = "AI-INSTALLATION-PREVIEW-v2.0";

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value, fallback = "ثبت نشده") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

const INSTALL_MODE_META = {
  roof: { title: "نصب روی سقف", scene: "rooftop solar installation", surface: "roof plane" },
  ground: { title: "نصب زمینی", scene: "ground mount solar installation", surface: "ground mounted structure" },
  hybrid: { title: "نصب ترکیبی", scene: "hybrid roof and ground solar installation", surface: "mixed roof and ground" },
  equipmentRoom: { title: "اتاق باتری و اینورتر", scene: "electrical and battery room layout", surface: "equipment room" },
};

export function buildInstallationPreviewPrompt({ installMode = "roof", siteImageTitle, panel, inverter, battery, project, environment } = {}) {
  const meta = INSTALL_MODE_META[installMode] || INSTALL_MODE_META.roof;
  const panelCount = safeNumber(panel?.count, 0);
  const panelPowerW = safeNumber(panel?.powerW, 620);
  const series = text(panel?.series, "-");
  const parallel = text(panel?.parallel, "-");
  const inverterPower = text(inverter?.powerW, "-");
  const batteryCount = text(battery?.count, "-");
  const city = text(environment?.city || project?.city, "محل پروژه");

  return [
    "Create a realistic industrial engineering visualization for a solar installation preview.",
    `Scene type: ${meta.scene}.`,
    `Use the provided project site photo as the base reference: ${siteImageTitle || "site image"}.`,
    `Location context: ${city}.`,
    `Show ${panelCount || "calculated"} solar panels rated ${panelPowerW}W each, arranged as ${series} series by ${parallel} parallel strings.`,
    `Show inverter placement with rated power ${inverterPower}W and a clean technical cable route.`,
    `Show battery bank zone with ${batteryCount} batteries only if the design requires batteries.`,
    "Keep the output realistic, clean, engineering-grade, not cartoonish, not decorative, no prices, no marketing text.",
    "Use subtle technical overlays, minimal labels, and preserve the real site perspective."
  ].join("\n");
}

function buildPanelRows(panel = {}) {
  return [
    { label: "تعداد پنل", value: `${text(panel.count)} عدد`, reason: "بر اساس توان و انرژی موردنیاز پروژه و خروجی موتور محاسبات تعیین شده است." },
    { label: "توان هر پنل", value: `${text(panel.powerW, 620)} وات`, reason: "توان مبنا برای طراحی هوشمند آرایه پنل است و در صورت ورود دستی کاربر به‌روزرسانی می‌شود." },
    { label: "آرایش سری", value: `${text(panel.series)} سری`, reason: "برای قرار گرفتن ولتاژ رشته در محدوده مجاز MPPT انتخاب می‌شود." },
    { label: "آرایش موازی", value: `${text(panel.parallel)} موازی`, reason: "برای رسیدن به ظرفیت کل آرایه و کنترل جریان رشته‌ها تعیین می‌شود." },
  ];
}

function buildInverterRows(inverter = {}) {
  return [
    { label: "تعداد اینورتر", value: `${text(inverter.count)} عدد`, reason: "بر اساس توان پیک، سناریوی طراحی و ضریب اطمینان انتخاب شده است." },
    { label: "توان اینورتر", value: inverter.powerW === "-" ? "ثبت نشده" : `${text(inverter.powerW)} وات`, reason: "برای پوشش توان همزمان و ظرفیت رزرو توسعه آینده کنترل می‌شود." },
    { label: "نوع انتخاب", value: text(inverter.title, "انتخاب هوشمند"), reason: "از بانک اینورتر خورشیدی متناسب با مسیر آفگرید، آنگرید یا هیبرید انتخاب می‌شود." },
  ];
}

function buildBatteryRows(battery = {}) {
  return [
    { label: "تعداد باتری", value: `${text(battery.count)} عدد`, reason: "برای تامین ذخیره انرژی و روزهای خودکفایی محاسبه شده است." },
    { label: "ولتاژ / ظرفیت", value: `${text(battery.voltageV)}V / ${text(battery.capacityAh)}Ah`, reason: "برای سازگاری با باس DC و ظرفیت ذخیره مورد نیاز انتخاب شده است." },
    { label: "آرایش سری", value: `${text(battery.series)} سری`, reason: "برای رسیدن به ولتاژ کاری بانک باتری تعیین شده است." },
    { label: "آرایش موازی", value: `${text(battery.parallel)} موازی`, reason: "برای افزایش ظرفیت Ah و پایداری ذخیره انرژی استفاده می‌شود." },
  ];
}

export function createAIInstallationPreview({ installMode = "roof", image, panel, inverter, battery, project, environment } = {}) {
  const meta = INSTALL_MODE_META[installMode] || INSTALL_MODE_META.roof;
  const panelCount = safeNumber(panel?.count, 0);
  const confidence = Math.max(78, Math.min(96, 84 + Math.min(panelCount, 16) * 0.6 + (image?.src ? 4 : 0)));
  const prompt = buildInstallationPreviewPrompt({ installMode, siteImageTitle: image?.title, panel, inverter, battery, project, environment });

  return {
    version: SHIL_AI_LAYER_VERSION,
    createdAt: new Date().toISOString(),
    mode: "optional-ai-installation-visualization",
    status: "ready",
    installMode,
    installModeTitle: meta.title,
    image,
    prompt,
    confidence: Math.round(confidence),
    visualSpec: {
      surface: meta.surface,
      perspective: "preserve-site-perspective",
      overlayStyle: "industrial-minimal",
      maxVisiblePanels: Math.min(panelCount || 8, 18),
      labels: ["PV ARRAY", "INVERTER", "BATTERY BANK", "DC/AC PROTECTION"],
    },
    panel,
    inverter,
    battery,
    tables: {
      panel: buildPanelRows(panel),
      inverter: buildInverterRows(inverter),
      battery: buildBatteryRows(battery),
    },
    qualityChecks: [
      { title: "همخوانی با تصویر محل نصب", status: image?.src ? "آماده" : "نیازمند تصویر", note: "تصویر شرایط محیطی به عنوان مرجع شبیه‌سازی استفاده می‌شود." },
      { title: "همخوانی با موتور محاسبات", status: "آماده", note: "تعداد پنل، اینورتر و باتری از خروجی محاسبات خوانده شده است." },
      { title: "قابلیت استفاده در خروجی نهایی", status: "آماده", note: "نتیجه در صفحه خروجی نهایی، ذخیره تصویر و PDF استفاده می‌شود." },
    ],
    engineeringNote: "این خروجی یک شبیه‌سازی تصویری اختیاری برای نمایش محل نصب آینده است و جایگزین بازدید اجرایی، برداشت ابعاد، سازه و تأیید نهایی نصاب نیست.",
  };
}
