export function calculateRiskRegister(input, result = {}) {
  const risks = [];
  const summary = result.summary || {};
  const validation = result.validation || {};
  const shadowLoss = Number(result.shadowAnalysis?.totalLossPercent ?? 0);
  const payback = Number(result.financials?.simplePaybackYears ?? 0);
  const inverterCount = Number(input.requestedParallelInverters || input.inverterParallelDesignCount || result.inverter?.parallelCount || summary.inverterParallelCount || 1);

  if ((validation.summary?.counts?.error || 0) > 0) {
    risks.push({ id: "validation_error", level: "critical", title: "خطای مهندسی باز", action: "قبل از خروجی نهایی باید موارد قرمز Validation اصلاح شوند." });
  }
  if (shadowLoss > 10) {
    risks.push({ id: "shadow_loss", level: "high", title: "تلفات سایه بالا", action: "بازبینی جانمایی پنل یا جابه‌جایی محل نصب پیشنهاد می‌شود." });
  }
  if (inverterCount > 1) {
    risks.push({ id: "parallel_architecture", level: inverterCount > 4 ? "high" : "medium", title: "معماری چند اینورتری", action: "تابلو، سنکرون، تقسیم بار، حفاظت و کابل هر شاخه باید جداگانه کنترل شود." });
  }
  if (payback > 0 && payback > 7) {
    risks.push({ id: "financial_payback", level: "medium", title: "بازگشت سرمایه طولانی", action: "سناریوی اقتصادی‌تر یا کاهش Oversize بررسی شود." });
  }
  if (input.systemType === "backup" && Number(input.backupHours || 0) > 8) {
    risks.push({ id: "backup_runtime", level: "medium", title: "زمان برق اضطراری زیاد", action: "تقسیم بارهای حیاتی/غیرحیاتی و Load Priority توصیه می‌شود." });
  }
  if (!input.siteGps && !input.latitude) {
    risks.push({ id: "missing_site", level: "low", title: "Site Survey کامل نشده", action: "برای گزارش اجرایی، GPS و عکس محل نصب ثبت شود." });
  }

  const criticalCount = risks.filter((item) => item.level === "critical").length;
  const highCount = risks.filter((item) => item.level === "high").length;
  return {
    version: "Engineering Risk Register v5",
    status: criticalCount ? "blocked" : highCount ? "needs_review" : risks.length ? "monitor" : "clear",
    criticalCount,
    highCount,
    risks,
  };
}
