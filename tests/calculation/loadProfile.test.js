import { buildLoadProfile } from "../../src/calculation/load/LoadProfileBuilder.js";
import { assert } from "../fixtures.js";

const profile = buildLoadProfile([
  { name: "LED", quantity: 10, powerW: 12, hoursPerDay: 5, simultaneityFactor: 1, category: "lighting" },
  { name: "Pump", quantity: 1, powerW: 750, hoursPerDay: 1, simultaneityFactor: 0.7, surgeFactor: 3, category: "motor" }
]);

assert(profile.dailyEnergyWh === 1350, "Load profile should calculate daily energy.");
assert(profile.connectedPowerW === 870, "Load profile should calculate connected power.");
assert(profile.peakLoadW === 645, "Load profile should calculate simultaneity peak.");
assert(profile.surgeLoadW === 2250, "Load profile should calculate surge load.");
assert(profile.byCategory.lighting === 600, "Load profile should group energy by category.");

console.log("loadProfile.test passed");
