import { calculateVoltageDropPercent } from "../../validation/engineering/rules/cableRules.js";

export function sizeCable({
  lengthM,
  currentA,
  systemVoltage,
  material = "copper",
  allowedVoltageDropPercent = 3,
  standardCrossSectionsMm2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120]
}) {
  const candidates = standardCrossSectionsMm2.map((crossSectionMm2) => {
    const voltageDropPercent = calculateVoltageDropPercent({
      lengthM,
      currentA,
      crossSectionMm2,
      systemVoltage,
      material
    });

    return {
      crossSectionMm2,
      voltageDropPercent,
      withinLimit: voltageDropPercent <= allowedVoltageDropPercent
    };
  });

  return candidates.find((item) => item.withinLimit) || candidates[candidates.length - 1];
}
