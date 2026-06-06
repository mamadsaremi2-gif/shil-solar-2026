export const SHIL_ADMIN_PANEL_READINESS = {
  version: "admin-foundation-100",
  scope: "engineering-only",
  modules: [
    { key: "equipment-banks", title: "مدیریت بانک تجهیزات", status: "foundation-ready", entities: ["solarPanels", "solarInverters", "batteries", "protection", "cables"], note: "بانک‌ها فقط مشخصات فنی تجهیزات را کنترل می‌کنند؛ قیمت، خرید و فروش تعریف نمی‌شود." },
    { key: "environment-rules", title: "قوانین شرایط محیطی", status: "foundation-ready", entities: ["cityClimate", "psh", "losses", "orientation", "tilt", "soiling"], note: "ضرایب شهر، جهت، زاویه، تلفات و راندمان برای موتور خورشیدی قابل کنترل هستند." },
    { key: "workflow-control", title: "کنترل مسیرهای پروژه", status: "foundation-ready", entities: ["manualProject", "readyScenario", "utilityGateway"], note: "مسیر پروژه جدید، سناریوی آماده و نیروگاهی ایزوله باقی می‌مانند." },
    { key: "engineering-approval", title: "تأیید مهندسی پروژه", status: "planned", entities: ["review", "lockCalculation", "export"], note: "در مرحله بعد، ادمین می‌تواند نتایج محاسبات را بازبینی و تأیید کند." }
  ],
  roles: ["superAdmin", "engineeringAdmin", "designer", "reviewer"],
  prohibited: ["pricing", "sales", "marketplace", "cart"],
};

export function getAdminPanelReadinessSummary() {
  const ready = SHIL_ADMIN_PANEL_READINESS.modules.filter((item) => item.status === "foundation-ready").length;
  return { status: "foundation-ready", readyModules: ready, totalModules: SHIL_ADMIN_PANEL_READINESS.modules.length, engineeringOnly: true, message: "زیرساخت پنل مدیریت برای کنترل فنی بانک‌ها، مسیرها و ضرایب محیطی آماده است؛ بخش فروش و قیمت وجود ندارد." };
}
