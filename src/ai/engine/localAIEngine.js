export function runLocalAIRecommendation(project = {}) {
  const dailyEnergyWh =
    project.dailyEnergyWh || 12500;

  const peakLoadW =
    project.peakLoadW || 4800;

  const backupHours =
    project.backupHours || 8;

  const panelPowerW =
    project.panelPowerW || 585;

  const pvKw =
    Math.ceil((dailyEnergyWh / 5.2 / 0.82) / 100) / 10;

  const panelCount =
    Math.ceil((pvKw * 1000) / panelPowerW);

  const batteryKWh =
    Math.ceil((peakLoadW * backupHours) / 1000);

  const inverterKw =
    Math.ceil((peakLoadW * 1.25) / 1000);

  return {
    mode: "LOCAL_AI",
    pvKw,
    panelCount,
    batteryKWh,
    inverterKw,
    confidence: 0.88,
    risks: [
      "تحلیل سایه باید با داده واقعی سایت تکمیل شود.",
      "دمای محیط می‌تواند خروجی پنل را کاهش دهد.",
      "کنترل MPPT باید با Voc سرد بررسی شود.",
    ],
    recommendation:
      `پیشنهاد اولیه: ${panelCount} عدد پنل ${panelPowerW} وات، اینورتر ${inverterKw} کیلووات و باتری حدود ${batteryKWh} کیلووات‌ساعت.`,
  };
}
