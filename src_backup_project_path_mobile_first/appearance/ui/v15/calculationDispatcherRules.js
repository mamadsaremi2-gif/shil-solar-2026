export function detectProjectFamily(form = {}) {
  const path = form.projectPath || form.family || "";
  if (["offgrid", "ongrid", "hybrid", "solar"].includes(path)) return "solar";
  if (["emergency", "ups", "backup", "generator"].includes(path)) return "emergency";
  return null;
}

export function getCalculationEngineName(form = {}) {
  const family = detectProjectFamily(form);
  if (family === "solar") return "SolarUnifiedCalculationEngine";
  if (family === "emergency") return "EmergencyPowerUnifiedCalculationEngine";
  throw new Error("Unknown project family.");
}

export function getReadyScenarioEntry(type) {
  if (type === "solar") return ["environmentalConditions", "equipmentList", "solarCalculation"];
  if (type === "emergency") return ["equipmentList", "emergencyCalculation"];
  return [];
}
