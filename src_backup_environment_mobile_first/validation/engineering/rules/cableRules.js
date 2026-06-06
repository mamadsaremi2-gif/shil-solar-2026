import { error, warning } from "../validationMessage.js";

const RESISTIVITY = {
  copper: 0.0175,
  aluminum: 0.0282
};

export function calculateVoltageDropPercent({ lengthM, currentA, crossSectionMm2, systemVoltage, material = "copper" }) {
  if (!lengthM || !currentA || !crossSectionMm2 || !systemVoltage) return 0;
  const resistivity = RESISTIVITY[material] || RESISTIVITY.copper;
  const voltageDrop = (2 * lengthM * currentA * resistivity) / crossSectionMm2;
  return (voltageDrop / systemVoltage) * 100;
}

export function validateCableRules(form) {
  const messages = [];
  const { cable, pv } = form;

  if (cable.lengthM < 0) messages.push(error("cable.lengthM", "Cable length cannot be negative."));
  if (cable.currentA < 0) messages.push(error("cable.currentA", "Cable current cannot be negative."));
  if (cable.crossSectionMm2 <= 0) messages.push(error("cable.crossSectionMm2", "Cable cross section must be greater than zero."));

  const drop = calculateVoltageDropPercent({
    ...cable,
    systemVoltage: pv.dcBusVoltage
  });

  if (drop > cable.allowedVoltageDropPercent) {
    messages.push(error("cable.crossSectionMm2", "Cable voltage drop exceeds allowed limit.", "CABLE_VOLTAGE_DROP"));
  }

  if (drop > 2 && drop <= cable.allowedVoltageDropPercent) {
    messages.push(warning("cable.crossSectionMm2", "Cable voltage drop is acceptable but close to design limit."));
  }

  return messages;
}
