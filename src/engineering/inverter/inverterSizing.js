export function calculateInverterSizing({
  peakLoadW = 0,
  surgeFactor = 1.3,
  safetyFactor = 1.15,
}) {
  const continuousPowerW =
    peakLoadW * safetyFactor;

  const surgePowerW =
    peakLoadW * surgeFactor;

  const recommendedInverterW =
    Math.ceil(Math.max(continuousPowerW, surgePowerW));

  return {
    continuousPowerW: Math.round(continuousPowerW),
    surgePowerW: Math.round(surgePowerW),
    recommendedInverterW,
  };
}
