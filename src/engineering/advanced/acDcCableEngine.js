const RESISTIVITY = { copper: 0.0175, aluminum: 0.0282 };

export function calculateDCCable({ lengthM, currentA, voltageV, crossSectionMm2, material = "copper" }) {
  const r = RESISTIVITY[material] || RESISTIVITY.copper;
  const voltageDropV = (2 * lengthM * currentA * r) / crossSectionMm2;
  return {
    voltageDropV,
    voltageDropPercent: voltageV > 0 ? (voltageDropV / voltageV) * 100 : 0,
    powerLossW: voltageDropV * currentA
  };
}

export function calculateACCableSinglePhase({ lengthM, currentA, voltageV = 230, crossSectionMm2, powerFactor = 0.95, material = "copper" }) {
  const r = RESISTIVITY[material] || RESISTIVITY.copper;
  const voltageDropV = (2 * lengthM * currentA * r * powerFactor) / crossSectionMm2;
  return {
    voltageDropV,
    voltageDropPercent: voltageV > 0 ? (voltageDropV / voltageV) * 100 : 0,
    powerLossW: voltageDropV * currentA
  };
}

export function calculateACCableThreePhase({ lengthM, currentA, voltageV = 400, crossSectionMm2, powerFactor = 0.95, material = "copper" }) {
  const r = RESISTIVITY[material] || RESISTIVITY.copper;
  const voltageDropV = (Math.sqrt(3) * lengthM * currentA * r * powerFactor) / crossSectionMm2;
  return {
    voltageDropV,
    voltageDropPercent: voltageV > 0 ? (voltageDropV / voltageV) * 100 : 0,
    powerLossW: Math.sqrt(3) * voltageDropV * currentA * powerFactor
  };
}
