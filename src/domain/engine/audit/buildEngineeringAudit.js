export function buildEngineeringAudit({ input, result }) {
  const validationChecks = result?.validation?.checks || [];
  const advisor = result?.advisor || [];
  const criticalValidation = validationChecks.filter((item) => ["error", "warning"].includes(item.severity));
  const criticalAdvisor = advisor.filter((item) => ["error", "warning"].includes(item.severity));
  const events = [...criticalValidation, ...criticalAdvisor].slice(0, 30).map((item) => ({
    severity: item.severity,
    category: item.category || item.relatedStep || "engineering",
    title: item.title,
    message: item.message,
    recommendation: item.recommendation || "بازبینی طراحی و اجرای مسیر اصلاح پیشنهادی.",
  }));

  const blockers = events.filter((item) => item.severity === "error");
  return {
    shouldSendToManagement: events.length > 0,
    status: blockers.length ? "blocked" : events.length ? "needs_review" : "clear",
    eventCount: events.length,
    projectTitle: input?.projectTitle || "پروژه بدون عنوان",
    systemType: input?.systemType,
    calculationMode: input?.calculationMode || "engineering",
    events,
  };
}
