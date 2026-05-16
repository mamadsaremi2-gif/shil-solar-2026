export function calculatePVArray({
  dailyEnergyWh = 0,
  peakSunHours = 5,
  panelPowerW = 585,
  systemLossPercent = 18,
}) {
  const requiredEnergyWh =
    dailyEnergyWh / (1 - systemLossPercent / 100);

  const pvPowerW =
    requiredEnergyWh / peakSunHours;

  const panelCount =
    Math.ceil(pvPowerW / panelPowerW);

  const arrayPowerW =
    panelCount * panelPowerW;

  return {
    requiredEnergyWh: Math.round(requiredEnergyWh),
    pvPowerW: Math.round(pvPowerW),
    panelCount,
    arrayPowerW,
  };
}
