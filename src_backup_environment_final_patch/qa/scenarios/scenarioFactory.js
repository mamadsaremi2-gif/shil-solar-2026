import { createEngineeringForm } from "../../contracts/engineeringFormContract.js";

export function createScenarioFixture({
  title = "Generated Scenario",
  scenario = "offgrid",
  dailyEnergyWh = 12000,
  peakLoadW = 2500,
  autonomyDays = 1,
  panelPowerW = 550,
  seriesCount = 4,
  parallelCount = 2,
  batteryAh = 400,
  inverterW = 4000,
  cableMm2 = 25
} = {}) {
  return createEngineeringForm({
    project: {
      title,
      scenario,
      location: "QA City",
      dailyEnergyWh,
      peakLoadW,
      autonomyDays
    },
    pv: {
      panelPowerW,
      panelVoc: 49.8,
      panelVmp: 41.8,
      panelIsc: 14,
      panelImp: 13.2,
      seriesCount,
      parallelCount,
      dcBusVoltage: 48,
      temperatureMinC: -5,
      temperatureMaxC: 45,
      tempCoeffVocPercentPerC: -0.28
    },
    battery: {
      nominalVoltage: 48,
      capacityAh: batteryAh,
      depthOfDischarge: 0.8,
      roundTripEfficiency: 0.9
    },
    inverter: {
      ratedPowerW: inverterW,
      surgePowerW: inverterW * 1.5,
      maxDcVoltage: 500,
      mpptMinVoltage: 120,
      mpptMaxVoltage: 450,
      efficiency: 0.95
    },
    cable: {
      lengthM: 20,
      currentA: 40,
      crossSectionMm2: cableMm2,
      material: "copper",
      allowedVoltageDropPercent: 3
    },
    environment: {
      peakSunHours: 5,
      irradianceLossPercent: 2,
      soilingLossPercent: 3,
      shadingLossPercent: 2
    }
  });
}

export function createScenarioMatrix() {
  return [
    createScenarioFixture({ title: "Small Offgrid", scenario: "offgrid", dailyEnergyWh: 5000, peakLoadW: 1200, batteryAh: 200, inverterW: 2000, seriesCount: 3, parallelCount: 1 }),
    createScenarioFixture({ title: "Medium Offgrid", scenario: "offgrid" }),
    createScenarioFixture({ title: "Hybrid Commercial", scenario: "hybrid", dailyEnergyWh: 30000, peakLoadW: 8000, batteryAh: 1000, inverterW: 10000, seriesCount: 5, parallelCount: 3 }),
    createScenarioFixture({ title: "Ongrid Rooftop", scenario: "ongrid", autonomyDays: 0, batteryAh: 0, inverterW: 5000, seriesCount: 5, parallelCount: 2 }),
    createScenarioFixture({ title: "Cable Stress", scenario: "offgrid", cableMm2: 4 })
  ];
}
