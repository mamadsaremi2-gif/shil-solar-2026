export function validateInverterCompatibility(panelVoltage, inverterVoltage) {
  if (panelVoltage > inverterVoltage) {
    return {
      valid: false,
      message: "Panel voltage exceeds inverter limit."
    };
  }

  return {
    valid: true
  };
}
