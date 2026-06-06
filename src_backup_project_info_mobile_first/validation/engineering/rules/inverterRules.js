import { error, warning } from "../validationMessage.js";

export function validateInverterRules(form) {
  const messages = [];
  const { project, inverter } = form;

  if (inverter.ratedPowerW <= 0) {
    messages.push(error("inverter.ratedPowerW", "Inverter rated power must be greater than zero."));
  }

  if (inverter.ratedPowerW > 0 && inverter.ratedPowerW < project.peakLoadW) {
    messages.push(error("inverter.ratedPowerW", "Inverter rated power is lower than peak load.", "INVERTER_UNDERSIZED"));
  }

  if (inverter.surgePowerW > 0 && inverter.surgePowerW < project.peakLoadW * 1.2) {
    messages.push(warning("inverter.surgePowerW", "Inverter surge power may be low for motor/inductive loads."));
  }

  if (inverter.efficiency <= 0 || inverter.efficiency > 1) {
    messages.push(error("inverter.efficiency", "Inverter efficiency must be between 0 and 1."));
  }

  return messages;
}
