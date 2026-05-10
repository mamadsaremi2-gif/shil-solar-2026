function safe(value, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : value;
}
function countWarnings(items = []) { return items.filter((item) => item?.severity === "warning").length; }
function countErrors(items = []) { return items.filter((item) => item?.severity === "error").length; }
export function buildProfessionalReportSnapshot({ input, result, financials }) {
  const summary = result?.summary || {};
  const advisor = result?.advisor || [];
  const audit = result?.engineeringAudit || {};
  const projectCode = input.projectCode || `SHIL-${String(input.projectTitle || "PROJECT").replace(/\s+/g, "-").slice(0, 18).toUpperCase()}-${new Date().getFullYear()}`;
  const designSource = input.scenarioId ? "سناریوی آماده" : input.engineeringDecisionSource ? "تصمیم مهندسی/Recovery" : "مسیر دستی یا مرحله‌ای";
  const reportSections = [
    { key: "cover", title: "جلد گزارش", status: "ready" },
    { key: "design_trace", title: "مسیر طراحی و تصمیم‌ها", status: "ready" },
    { key: "site_survey", title: "Site Survey، عکس محل و اقلیم", status: input.siteGps || input.latitude || input.sitePhotoUrl ? "ready" : "partial" },
    { key: "production_chart", title: "نمودار تولید و پیش‌بینی", status: summary.lossModelAnnualNetProductionKwh || summary.climateForecastAnnualKwh ? "ready" : "partial" },
    { key: "shadow_chart", title: "نمودار سایه", status: summary.shadowLossPercent || input.shadowPercent ? "ready" : "partial" },
    { key: "losses", title: "مدل تلفات", status: summary.lossModelTotalPercent ? "ready" : "partial" },
    { key: "electrical", title: "طراحی الکتریکال", status: "ready" },
    { key: "validation", title: "اعتبارسنجی و هشدارها", status: advisor.length ? "needs_review" : "ready" },
    { key: "financial", title: "برآورد مالی", status: financials?.costCompleteness === "estimated" ? "ready" : "partial" },
    { key: "operations", title: "ریسک و نگهداری", status: result?.riskRegister?.status === "blocked" ? "needs_review" : "ready" },
    { key: "appendix", title: "پیوست محاسبات", status: "ready" },
  ];
  return {
    projectCode,
    generatedAt: new Date().toISOString(),
    reportVersion: "Industrial PDF Report v10 - Workspace",
    designSource,
    decisionSource: safe(input.engineeringDecisionSource, "Unified Engineering State"),
    decisionTitle: safe(input.engineeringDecisionTitle, "مسیر عادی بدون Recovery"),
    systemType: input.systemType,
    projectTitle: safe(input.projectTitle),
    city: safe(input.city),
    status: summary.designStatus || "draft",
    counts: { warnings: countWarnings(advisor), errors: countErrors(advisor), managementEvents: audit.eventCount || 0, risks: result?.riskRegister?.risks?.length || 0, maintenanceTasks: result?.maintenancePlan?.tasks?.length || 0 },
    trace: [
      input.scenarioTitle ? `شروع از سناریوی آماده: ${input.scenarioTitle}` : "شروع از مسیر انتخاب کاربر",
      input.engineeringDecisionTitle ? `تصمیم اعمال‌شده: ${input.engineeringDecisionTitle}` : "بدون Recovery اجباری",
      `موتور: ${result?.engineMeta?.engineName || "Unified SHIL Engineering Engine"}`,
      result?.riskRegister?.status ? `Risk Register: ${result.riskRegister.status}` : "Risk Register: clear",
      result?.maintenancePlan?.nextServiceLabel ? `سرویس بعدی: ${result.maintenancePlan.nextServiceLabel}` : "سرویس دوره‌ای ثبت نشده",
    ],
    sections: reportSections,
    qrPayload: JSON.stringify({ projectCode, title: input.projectTitle, status: summary.designStatus || "draft" }),
    productionChart: { dailyKwh: summary.lossModelNetDailyProductionWh ? Math.round(summary.lossModelNetDailyProductionWh / 100) / 10 : summary.climateForecastDailyKwh || 0, annualKwh: summary.lossModelAnnualNetProductionKwh || summary.climateForecastAnnualKwh || 0 },
    shadowChart: { shadowPercent: summary.shadowLossPercent || input.shadowPercent || input.manualShadowPercent || 0, criticalHours: summary.shadowCriticalHours || input.shadowCriticalHours || "—" },
    lossBreakdown: { total: summary.lossModelTotalPercent || 0, temperature: summary.lossTemperaturePercent || 0, cable: summary.lossCablePercent || 0, dust: summary.lossDustPercent || 0, angle: summary.lossAnglePercent || 0, mismatch: summary.lossMismatchPercent || 0, mppt: summary.lossMpptPercent || 0 },
  };
}
