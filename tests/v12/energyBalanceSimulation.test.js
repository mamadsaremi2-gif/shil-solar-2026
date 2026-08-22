import { EnergyBalanceSimulator } from "../../src/engineering/simulation/EnergyBalanceSimulator.js";
import { generateHourlyPVFromDailyEnergy } from "../../src/engineering/simulation/HourlyPVGenerator.js";
import { assert } from "../fixtures.js";

const hourlyLoad = Array(24).fill(500);
const hourlyPV = generateHourlyPVFromDailyEnergy(16000);
const simulator = new EnergyBalanceSimulator({
  batteryCapacityWh: 10000,
  initialSocPercent: 50,
  minSocPercent: 10
});

const result = simulator.simulate({ hourlyLoadWh: hourlyLoad, hourlyPVWh: hourlyPV });

assert(result.timeline.length === 24, "Energy simulation should produce 24-hour timeline.");
assert(result.finalSocPercent >= 10, "Simulation should respect minimum SOC.");
assert(result.reliabilityPercent >= 0 && result.reliabilityPercent <= 100, "Reliability should be percentage.");
assert(result.batteryCyclesEquivalent >= 0, "Simulation should calculate equivalent cycles.");

console.log("energyBalanceSimulation.test passed");
