import { buildHourlyLoadProfile } from "../../src/engineering/load/HourlyLoadProfileEngine.js";
import { assert } from "../fixtures.js";

const profile = buildHourlyLoadProfile([
  { name: "Lights", quantity: 10, powerW: 10, schedule: [18, 19, 20, 21, 22], category: "lighting" },
  { name: "Pump", quantity: 1, powerW: 750, schedule: [10, 11], simultaneityFactor: 0.8, category: "motor" }
]);

assert(profile.dailyEnergyWh === 1700, "Hourly profile should calculate daily energy.");
assert(profile.peakLoadW === 600, "Hourly profile should calculate peak load using simultaneity.");
assert(profile.peakHour === 10, "Hourly profile should identify peak hour.");
assert(profile.loadFactor > 0, "Hourly profile should calculate load factor.");

console.log("hourlyLoadProfile.test passed");
