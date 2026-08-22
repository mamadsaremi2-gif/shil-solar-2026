import { validatePVRules } from "./rules/pvRules.js";

export function validatePVSystem(form) {
  const normalized = {
    project: { scenario: "offgrid" },
    pv: {
      panelPowerW: form.panelPower ?? form.panelPowerW ?? 0,
      panelVoc: form.panelVoc ?? 50,
      panelVmp: form.panelVmp ?? 42,
      panelImp: form.panelImp ?? 13,
      seriesCount: form.seriesCount ?? 1,
      parallelCount: form.parallelCount ?? 1,
      dcBusVoltage: form.systemVoltage ?? form.dcBusVoltage ?? 48,
      temperatureMinC: form.temperatureMinC ?? 0,
      tempCoeffVocPercentPerC: form.tempCoeffVocPercentPerC ?? -0.28
    },
    inverter: {
      maxDcVoltage: form.maxDcVoltage ?? 1000,
      mpptMinVoltage: form.mpptMinVoltage ?? 40,
      mpptMaxVoltage: form.mpptMaxVoltage ?? 900
    },
    environment: { peakSunHours: form.peakSunHours ?? 4.5 }
  };

  const errors = validatePVRules(normalized).filter((m) => m.severity === "error");
  return { valid: errors.length === 0, errors: errors.map((e) => e.message) };
}
