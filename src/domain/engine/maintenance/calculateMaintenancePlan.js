export function calculateMaintenancePlan(input, result = {}) {
  const isBackup = input.systemType === "backup";
  const dustFactor = Number(input.dustFactor ?? 0.96);
  const shadowLoss = Number(result.shadowAnalysis?.totalLossPercent ?? 0);
  const maxTemp = Number(input.maxTemperature ?? 35);
  const batteryType = input.batteryType || "LFP";
  const industrialScore = Number(result.industrial?.serviceabilityScore ?? 70);

  const washIntervalDays = dustFactor < 0.9 ? 14 : dustFactor < 0.95 ? 30 : 45;
  const inspectionIntervalDays = industrialScore < 55 ? 15 : industrialScore < 75 ? 30 : 60;
  const batteryInspectionDays = batteryType === "lead_acid" ? 30 : 90;

  const tasks = [
    !isBackup ? { id: "panel_wash", title: "شست‌وشوی پنل‌ها", intervalDays: washIntervalDays, priority: dustFactor < 0.92 ? "high" : "medium", reason: `ضریب گردوغبار ${dustFactor.toFixed(2)} ثبت شده است.` } : null,
    !isBackup ? { id: "shadow_review", title: "بازبینی سایه و موانع", intervalDays: shadowLoss > 8 ? 30 : 90, priority: shadowLoss > 8 ? "high" : "low", reason: `تلفات سایه ${shadowLoss.toFixed(1)}٪ محاسبه شده است.` } : null,
    { id: "battery_health", title: "کنترل سلامت بانک باتری", intervalDays: batteryInspectionDays, priority: batteryType === "lead_acid" ? "high" : "medium", reason: `نوع باتری ${batteryType} است.` },
    { id: "cable_terminal", title: "کنترل ترمینال، کابل و اتصالات", intervalDays: inspectionIntervalDays, priority: industrialScore < 60 ? "high" : "medium", reason: `امتیاز سرویس‌پذیری ${industrialScore.toFixed(0)} از ۱۰۰ است.` },
    maxTemp > 40 ? { id: "thermal_review", title: "بازبینی تهویه و دمای تجهیزات", intervalDays: 30, priority: "high", reason: `حداکثر دمای محیط ${maxTemp.toFixed(0)}°C است.` } : null,
  ].filter(Boolean);

  const highPriorityCount = tasks.filter((item) => item.priority === "high").length;
  return {
    version: "Maintenance Plan v5",
    status: highPriorityCount ? "needs_follow_up" : "normal",
    highPriorityCount,
    tasks,
    nextServiceLabel: tasks[0] ? `${tasks[0].title} - هر ${tasks[0].intervalDays} روز` : "برنامه سرویس خاصی ثبت نشده است.",
  };
}
