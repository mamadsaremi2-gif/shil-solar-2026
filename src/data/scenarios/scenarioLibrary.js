const labels = {
  solar: "پروژه‌های انرژی خورشیدی",
  emergency: "پروژه‌های برق اضطراری",
  light: "سبک",
  medium: "متوسط",
  heavy: "سنگین",
};

export function getScenarioList(domain = "solar", weight = "light") {
  return Array.from({ length: 100 }, (_, index) => ({
    id: `${domain}-${weight}-${index + 1}`,
    title: `${labels[domain]} - سناریوی ${labels[weight]} ${index + 1}`,
    domain,
    weight,
    description: `سناریوی آماده ${labels[weight]} برای شروع سریع پروژه و تکمیل خودکار اطلاعات پایه.`,
    payload: {
      usageType: weight === "heavy" ? "صنعتی" : weight === "medium" ? "تجاری" : "خانگی",
      estimatedPowerW: weight === "heavy" ? 15000 : weight === "medium" ? 7000 : 2500,
      source: "scenario-library",
    },
  }));
}
