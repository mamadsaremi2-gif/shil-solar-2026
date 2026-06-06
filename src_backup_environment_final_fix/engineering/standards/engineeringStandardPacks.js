export const ENGINEERING_STANDARD_PACKS = {
  SHIL_BASIC_2026: {
    id: "SHIL_BASIC_2026",
    label: "SHIL Basic Engineering 2026",
    voltageDrop: {
      dcRecommendedPercent: 2,
      dcMaximumPercent: 3,
      acRecommendedPercent: 2,
      acMaximumPercent: 5
    },
    protection: {
      pvFuseFactor: 1.25,
      breakerFactor: 1.25,
      continuousLoadFactor: 1.25,
      spdSafetyFactor: 1.2
    },
    pv: {
      maxDcResidentialV: 1000,
      moduleTempNoctC: 45,
      defaultSystemLossPercent: 14
    },
    battery: {
      minAutonomyOffgridDays: 1,
      maxRecommendedDoD: 0.85,
      minRoundTripEfficiency: 0.75
    },
    inverter: {
      minPowerMargin: 1.25,
      surgeMargin: 1.2
    }
  },
  SHIL_CONSERVATIVE_2026: {
    id: "SHIL_CONSERVATIVE_2026",
    label: "SHIL Conservative Engineering 2026",
    voltageDrop: {
      dcRecommendedPercent: 1.5,
      dcMaximumPercent: 2,
      acRecommendedPercent: 1.5,
      acMaximumPercent: 3
    },
    protection: {
      pvFuseFactor: 1.35,
      breakerFactor: 1.25,
      continuousLoadFactor: 1.25,
      spdSafetyFactor: 1.25
    },
    pv: {
      maxDcResidentialV: 600,
      moduleTempNoctC: 45,
      defaultSystemLossPercent: 18
    },
    battery: {
      minAutonomyOffgridDays: 1.5,
      maxRecommendedDoD: 0.75,
      minRoundTripEfficiency: 0.8
    },
    inverter: {
      minPowerMargin: 1.35,
      surgeMargin: 1.35
    }
  }
};

export function getEngineeringStandardPack(id = "SHIL_BASIC_2026") {
  return ENGINEERING_STANDARD_PACKS[id] || ENGINEERING_STANDARD_PACKS.SHIL_BASIC_2026;
}
