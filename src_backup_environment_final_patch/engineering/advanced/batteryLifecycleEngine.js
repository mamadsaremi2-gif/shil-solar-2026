export function estimateBatteryLifecycle({
  chemistry = "LFP",
  depthOfDischarge = 0.8,
  averageTemperatureC = 25,
  cyclesPerYear = 300
}) {
  const baseCycles = chemistry === "LFP" ? 4500 : chemistry === "NMC" ? 2500 : 1200;
  const dodFactor = depthOfDischarge <= 0.7 ? 1.2 : depthOfDischarge <= 0.85 ? 1 : 0.75;
  const tempFactor = averageTemperatureC <= 30 ? 1 : Math.max(0.55, 1 - (averageTemperatureC - 30) * 0.025);
  const estimatedCycles = Math.round(baseCycles * dodFactor * tempFactor);
  const estimatedYears = cyclesPerYear > 0 ? estimatedCycles / cyclesPerYear : 0;

  return {
    chemistry,
    estimatedCycles,
    estimatedYears,
    dodFactor,
    tempFactor,
    risk: estimatedYears < 5 ? "high" : estimatedYears < 8 ? "medium" : "low"
  };
}
