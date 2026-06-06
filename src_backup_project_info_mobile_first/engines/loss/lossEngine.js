export function runLossEngine(form) {
  const { environment } = form;
  const totalLossPercent =
    environment.irradianceLossPercent +
    environment.soilingLossPercent +
    environment.shadingLossPercent;

  return {
    totalLossPercent,
    performanceRatio: Math.max(0, 1 - totalLossPercent / 100)
  };
}
