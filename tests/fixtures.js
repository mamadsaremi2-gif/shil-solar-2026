import { createEngineeringForm } from "../src/contracts/engineeringFormContract.js";

export function createValidOffgridFixture(overrides = {}) {
  return createEngineeringForm({
    project: {
      title: "Test Offgrid Project",
      scenario: "offgrid",
      location: "Tehran",
      dailyEnergyWh: 12000,
      peakLoadW: 2500,
      autonomyDays: 1
    },
    pv: {
      panelPowerW: 550,
      panelVoc: 49.8,
      panelVmp: 41.8,
      panelIsc: 14,
      panelImp: 13.2,
      seriesCount: 4,
      parallelCount: 2,
      dcBusVoltage: 48,
      temperatureMinC: -5,
      temperatureMaxC: 45,
      tempCoeffVocPercentPerC: -0.28
    },
    battery: {
      nominalVoltage: 48,
      capacityAh: 400,
      depthOfDischarge: 0.8,
      roundTripEfficiency: 0.9
    },
    inverter: {
      ratedPowerW: 4000,
      surgePowerW: 6000,
      maxDcVoltage: 500,
      mpptMinVoltage: 120,
      mpptMaxVoltage: 450,
      efficiency: 0.95
    },
    cable: {
      lengthM: 20,
      currentA: 40,
      crossSectionMm2: 25,
      material: "copper",
      allowedVoltageDropPercent: 3
    },
    environment: {
      peakSunHours: 5,
      irradianceLossPercent: 2,
      soilingLossPercent: 3,
      shadingLossPercent: 2
    },
    ...overrides
  });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
