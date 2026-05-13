import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { runAdvancedEngineering } from "../../src/engineering/advanced/advancedEngineeringEngine.js";
import { estimateOptimumTilt } from "../../src/engineering/advanced/solarGeometry.js";
import { estimateShadingLoss } from "../../src/engineering/advanced/shadingEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const form = createValidOffgridFixture();

assert(estimateOptimumTilt(35) > 25, "Optimum tilt should be plausible for latitude 35.");

const shading = estimateShadingLoss({
  horizonObstructions: [{ azimuthDeg: 180, elevationDeg: 20, season: "winter" }]
});
assert(shading.shadingLossPercent > 0, "Shading engine should estimate loss.");

const advanced = runAdvancedEngineering(form, { latitude: 35.6892 });
assert(advanced.cables.dc.voltageDropPercent >= 0, "Advanced engine should calculate DC cable drop.");
assert(advanced.cables.acSinglePhase.voltageDropPercent >= 0, "Advanced engine should calculate AC cable drop.");
assert(advanced.batteryLifecycle.estimatedYears > 0, "Advanced engine should estimate battery lifecycle.");

const result = runEngineeringPipeline(form, { advanced: { latitude: 35.6892 } });
assert(result.outputs.advanced.solarGeometry.monthlyTiltFactors.length === 12, "Pipeline should include advanced engineering.");
assert(result.trace.includes("engine:advanced"), "Pipeline trace should include advanced engine.");

console.log("advancedEngineering.test passed");
