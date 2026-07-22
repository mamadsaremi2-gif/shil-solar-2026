import { error, warning } from "../validationMessage.js";

export function validateBatteryRules(form) {
  const messages = [];
  const { project, battery } = form;

  if (project.scenario === "ongrid") {
    return messages;
  }

  if (battery.nominalVoltage <= 0) {
    messages.push(error("battery.nominalVoltage", "Battery nominal voltage must be greater than zero."));
  }

  if (battery.capacityAh <= 0) {
    messages.push(error("battery.capacityAh", "Battery capacity must be greater than zero."));
  }

  if (battery.depthOfDischarge <= 0 || battery.depthOfDischarge > 1) {
    messages.push(error("battery.depthOfDischarge", "Depth of discharge must be between 0 and 1."));
  }

  const usableWh = battery.nominalVoltage * battery.capacityAh * battery.depthOfDischarge * battery.roundTripEfficiency;
  const requiredWh = project.dailyEnergyWh * project.autonomyDays;

  if (usableWh > 0 && usableWh < requiredWh) {
    messages.push(error("battery.capacityAh", "Usable battery energy is lower than autonomy requirement.", "BATTERY_UNDERSIZED"));
  }

  if (battery.depthOfDischarge > 0.9) {
    messages.push(warning("battery.depthOfDischarge", "Depth of discharge is high; verify battery chemistry."));
  }

  return messages;
}
