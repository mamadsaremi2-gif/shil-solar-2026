import { coordinateProtection, coordinatePVProtection } from "../../src/engineering/protection/ProtectionCoordinationEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const coordinated = coordinateProtection({
  sourceCurrentA: 100,
  loadCurrentA: 40,
  cableAmpacityA: 80,
  upstreamBreakerA: 100
});

assert(coordinated.coordinated === true, "Protection should coordinate when breaker is below cable ampacity.");
assert(coordinated.selectedBreakerA >= coordinated.requiredBreakerA, "Protection should select breaker above required current.");

const bad = coordinateProtection({
  sourceCurrentA: 20,
  loadCurrentA: 40,
  cableAmpacityA: 30,
  upstreamBreakerA: 32
});

assert(bad.coordinated === false, "Protection should fail if breaker exceeds cable ampacity.");

const pv = coordinatePVProtection(createValidOffgridFixture());
assert(pv.stringFuseA > 0, "PV protection should size string fuse.");
assert(pv.dcMain.selectedBreakerA > 0, "PV protection should coordinate DC main.");

console.log("protectionCoordination.test passed");
