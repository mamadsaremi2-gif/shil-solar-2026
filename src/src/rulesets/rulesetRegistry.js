export const RULESET_VERSIONS = [
  {
    id: "shil-ruleset-2026-basic",
    version: "2026.1",
    label: "SHIL Basic Engineering Rules 2026.1",
    standards: ["SHIL_INTERNAL_BASIC"],
    active: true,
    limits: {
      maxDcVoltageResidential: 1000,
      defaultCableDropPercent: 3,
      defaultInverterMarginFactor: 1.25,
      defaultBatteryDoD: 0.8
    }
  },
  {
    id: "shil-ruleset-conservative",
    version: "2026.1-conservative",
    label: "SHIL Conservative Engineering Rules",
    standards: ["SHIL_INTERNAL_CONSERVATIVE"],
    active: false,
    limits: {
      maxDcVoltageResidential: 600,
      defaultCableDropPercent: 2,
      defaultInverterMarginFactor: 1.35,
      defaultBatteryDoD: 0.75
    }
  }
];

export function getActiveRuleset() {
  return RULESET_VERSIONS.find((ruleset) => ruleset.active) || RULESET_VERSIONS[0];
}

export function getRuleset(id) {
  return RULESET_VERSIONS.find((ruleset) => ruleset.id === id) || null;
}
