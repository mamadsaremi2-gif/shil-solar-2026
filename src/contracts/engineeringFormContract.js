export const DEFAULT_ENGINEERING_FORM = Object.freeze({
  project: {
    title: "",
    scenario: "offgrid",
    location: "",
    dailyEnergyWh: 0,
    peakLoadW: 0,
    autonomyDays: 1
  },
  pv: {
    panelPowerW: 0,
    panelVoc: 0,
    panelVmp: 0,
    panelIsc: 0,
    panelImp: 0,
    seriesCount: 1,
    parallelCount: 1,
    dcBusVoltage: 48,
    temperatureMinC: 0,
    temperatureMaxC: 45,
    tempCoeffVocPercentPerC: -0.28
  },
  battery: {
    nominalVoltage: 48,
    capacityAh: 0,
    depthOfDischarge: 0.8,
    roundTripEfficiency: 0.9
  },
  inverter: {
    ratedPowerW: 0,
    surgePowerW: 0,
    maxDcVoltage: 500,
    mpptMinVoltage: 120,
    mpptMaxVoltage: 450,
    efficiency: 0.95
  },
  cable: {
    lengthM: 0,
    currentA: 0,
    crossSectionMm2: 0,
    material: "copper",
    allowedVoltageDropPercent: 3
  },
  environment: {
    peakSunHours: 4.5,
    irradianceLossPercent: 0,
    soilingLossPercent: 3,
    shadingLossPercent: 0
  }
});

export function createEngineeringForm(partial = {}) {
  return {
    ...DEFAULT_ENGINEERING_FORM,
    ...partial,
    project: { ...DEFAULT_ENGINEERING_FORM.project, ...(partial.project || {}) },
    pv: { ...DEFAULT_ENGINEERING_FORM.pv, ...(partial.pv || {}) },
    battery: { ...DEFAULT_ENGINEERING_FORM.battery, ...(partial.battery || {}) },
    inverter: { ...DEFAULT_ENGINEERING_FORM.inverter, ...(partial.inverter || {}) },
    cable: { ...DEFAULT_ENGINEERING_FORM.cable, ...(partial.cable || {}) },
    environment: { ...DEFAULT_ENGINEERING_FORM.environment, ...(partial.environment || {}) }
  };
}
