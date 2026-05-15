export function calculatePVString({
  panelVoc = 49.5,
  panelVmp = 41.8,
  panelImp = 13.99,
  panelsPerString = 10,
  strings = 2,
  tempMinC = -5,
  tempCoeffVoc = -0.0028,
  mpptMinV = 120,
  mpptMaxV = 500,
  maxInputCurrentA = 30,
}) {
  const vocCold =
    panelVoc *
    panelsPerString *
    (1 + Math.abs(tempCoeffVoc) * (25 - tempMinC));

  const vmpString =
    panelVmp * panelsPerString;

  const currentTotal =
    panelImp * strings;

  const voltageOk =
    vocCold <= mpptMaxV && vmpString >= mpptMinV;

  const currentOk =
    currentTotal <= maxInputCurrentA;

  return {
    vocCold: Number(vocCold.toFixed(1)),
    vmpString: Number(vmpString.toFixed(1)),
    currentTotal: Number(currentTotal.toFixed(1)),
    voltageOk,
    currentOk,
    status: voltageOk && currentOk ? "PASS" : "CHECK",
  };
}
