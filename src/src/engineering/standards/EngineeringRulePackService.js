import { getEngineeringStandardPack } from "./engineeringStandardPacks.js";

export class EngineeringRulePackService {
  constructor(defaultPackId = "SHIL_BASIC_2026") {
    this.defaultPackId = defaultPackId;
  }

  getPack(id) {
    return getEngineeringStandardPack(id || this.defaultPackId);
  }

  evaluateVoltageDrop({ dcDropPercent = 0, acDropPercent = 0, packId } = {}) {
    const pack = this.getPack(packId);
    const issues = [];

    if (dcDropPercent > pack.voltageDrop.dcMaximumPercent) {
      issues.push({ severity: "error", code: "DC_DROP_MAX_EXCEEDED", message: "DC voltage drop exceeds maximum rule pack limit." });
    } else if (dcDropPercent > pack.voltageDrop.dcRecommendedPercent) {
      issues.push({ severity: "warning", code: "DC_DROP_RECOMMENDED_EXCEEDED", message: "DC voltage drop exceeds recommended limit." });
    }

    if (acDropPercent > pack.voltageDrop.acMaximumPercent) {
      issues.push({ severity: "error", code: "AC_DROP_MAX_EXCEEDED", message: "AC voltage drop exceeds maximum rule pack limit." });
    } else if (acDropPercent > pack.voltageDrop.acRecommendedPercent) {
      issues.push({ severity: "warning", code: "AC_DROP_RECOMMENDED_EXCEEDED", message: "AC voltage drop exceeds recommended limit." });
    }

    return {
      valid: issues.filter((item) => item.severity === "error").length === 0,
      issues,
      pack
    };
  }

  evaluateBattery({ depthOfDischarge, roundTripEfficiency, autonomyDays, scenario, packId }) {
    const pack = this.getPack(packId);
    const issues = [];

    if (depthOfDischarge > pack.battery.maxRecommendedDoD) {
      issues.push({ severity: "warning", code: "DOD_HIGH", message: "Battery depth of discharge exceeds recommended rule pack value." });
    }

    if (roundTripEfficiency < pack.battery.minRoundTripEfficiency) {
      issues.push({ severity: "warning", code: "BATTERY_EFFICIENCY_LOW", message: "Battery round-trip efficiency is below recommended value." });
    }

    if (scenario === "offgrid" && autonomyDays < pack.battery.minAutonomyOffgridDays) {
      issues.push({ severity: "error", code: "AUTONOMY_RULEPACK_LOW", message: "Offgrid autonomy days are below rule pack minimum." });
    }

    return {
      valid: issues.filter((item) => item.severity === "error").length === 0,
      issues,
      pack
    };
  }
}
