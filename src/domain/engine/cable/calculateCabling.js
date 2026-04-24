function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function nextCableSize(required) {
  const sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
  return sizes.find((size) => size >= required) ?? Math.ceil(required);
}

function calcTwoWireSection(lengthM, currentA, dropPercent, voltageV) {
  const rho = 0.0175;
  const deltaV = Math.max((dropPercent / 100) * voltageV, 0.1);
  const section = (2 * lengthM * currentA * rho) / deltaV;
  return Math.max(section, 1);
}

function calcDropPercent(lengthM, currentA, sectionMm2, voltageV) {
  const rho = 0.0175;
  const deltaV = (2 * lengthM * currentA * rho) / Math.max(sectionMm2, 0.1);
  return (deltaV / Math.max(voltageV, 1)) * 100;
}

export function calculateCabling(input, loads, inverter, pvResult, controller) {
  const dcPvCurrentA = pvResult ? (pvResult.installedPvPowerW / Math.max(pvResult.stringVmp, 1)) : 0;
  const batteryCurrentA = inverter.estimatedDcCurrentA;
  const acCurrentA = loads.demandPowerW / Math.max(input.loadVoltage * input.powerFactor * input.inverterEfficiency, 1);

  const dcCableRequired = pvResult
    ? calcTwoWireSection(input.dcCableLength, dcPvCurrentA, input.dcVoltageDropLimit, Math.max(pvResult.stringVmp, input.systemVoltage))
    : 0;
  const batteryCableRequired = calcTwoWireSection(input.batteryCableLength, batteryCurrentA, input.batteryVoltageDropLimit, input.systemVoltage);
  const acCableRequired = calcTwoWireSection(input.acCableLength, acCurrentA, input.acVoltageDropLimit, input.loadVoltage);

  const dcCableSizeMm2 = pvResult ? nextCableSize(dcCableRequired) : 0;
  const batteryCableSizeMm2 = nextCableSize(batteryCableRequired);
  const acCableSizeMm2 = nextCableSize(acCableRequired);

  return {
    dcPvCurrentA: round(dcPvCurrentA),
    batteryCurrentA: round(batteryCurrentA),
    acCurrentA: round(acCurrentA),
    dcCableSizeMm2,
    dcVoltageDropPercent: pvResult ? round(calcDropPercent(input.dcCableLength, dcPvCurrentA, dcCableSizeMm2, Math.max(pvResult.stringVmp, input.systemVoltage)), 2) : 0,
    batteryCableSizeMm2,
    batteryVoltageDropPercent: round(calcDropPercent(input.batteryCableLength, batteryCurrentA, batteryCableSizeMm2, input.systemVoltage), 2),
    acCableSizeMm2,
    acVoltageDropPercent: round(calcDropPercent(input.acCableLength, acCurrentA, acCableSizeMm2, input.loadVoltage), 2),
    controllerCurrentA: controller?.selectedCurrentA ?? 0,
  };
}
