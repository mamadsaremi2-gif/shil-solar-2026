export function calculateCableSizing({
  currentA = 0,
  lengthM = 0,
  voltageV = 48,
  cableAreaMm2 = 6,
  maxVoltageDropPercent = 3,
}) {
  const copperResistivity =
    0.0175;

  const voltageDropV =
    (2 * copperResistivity * lengthM * currentA) /
    cableAreaMm2;

  const voltageDropPercent =
    (voltageDropV / voltageV) * 100;

  const status =
    voltageDropPercent <= maxVoltageDropPercent
      ? "PASS"
      : "CHECK";

  return {
    voltageDropV: Number(voltageDropV.toFixed(2)),
    voltageDropPercent: Number(voltageDropPercent.toFixed(2)),
    status,
  };
}
