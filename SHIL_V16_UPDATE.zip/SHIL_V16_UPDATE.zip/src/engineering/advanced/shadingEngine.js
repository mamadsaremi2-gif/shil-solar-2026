export function estimateShadingLoss({ horizonObstructions = [], defaultLossPercent = 0 }) {
  if (!horizonObstructions.length) {
    return {
      shadingLossPercent: defaultLossPercent,
      risk: defaultLossPercent > 10 ? "medium" : "low",
      contributors: []
    };
  }

  const contributors = horizonObstructions.map((item) => {
    const azimuthWeight = Math.max(0.2, 1 - Math.abs((item.azimuthDeg || 180) - 180) / 180);
    const heightWeight = Math.min((item.elevationDeg || 0) / 45, 1);
    const seasonalWeight = item.season === "winter" ? 1.2 : item.season === "summer" ? 0.7 : 1;
    const lossPercent = Math.min(30, azimuthWeight * heightWeight * seasonalWeight * 18);
    return { ...item, lossPercent };
  });

  const totalLoss = Math.min(45, contributors.reduce((sum, item) => sum + item.lossPercent, 0));

  return {
    shadingLossPercent: totalLoss,
    risk: totalLoss >= 20 ? "high" : totalLoss >= 8 ? "medium" : "low",
    contributors
  };
}
