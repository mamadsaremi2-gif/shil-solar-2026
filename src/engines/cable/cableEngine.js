import { calculateVoltageDropPercent } from "../../validation/engineering/rules/cableRules.js";

export function runCableEngine(form) {
  const voltageDropPercent = calculateVoltageDropPercent({
    ...form.cable,
    systemVoltage: form.pv.dcBusVoltage
  });

  return {
    voltageDropPercent,
    withinLimit: voltageDropPercent <= form.cable.allowedVoltageDropPercent
  };
}
