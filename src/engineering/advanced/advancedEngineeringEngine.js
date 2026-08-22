import { estimateOptimumTilt, estimateMonthlyTiltFactors } from "./solarGeometry.js";
import { estimateShadingLoss } from "./shadingEngine.js";
import { calculateDCCable, calculateACCableSinglePhase, calculateACCableThreePhase } from "./acDcCableEngine.js";
import { estimateBatteryLifecycle } from "./batteryLifecycleEngine.js";

export function runAdvancedEngineering(form, options = {}) {
  const latitude = options.latitude ?? 35.6892;
  const tilt = options.tilt ?? estimateOptimumTilt(latitude);
  const monthlyTiltFactors = estimateMonthlyTiltFactors(latitude, tilt);
  const shading = estimateShadingLoss(options.shading || {});
  const dcCable = calculateDCCable({
    lengthM: form.cable.lengthM,
    currentA: form.cable.currentA || form.pv.panelImp * form.pv.parallelCount,
    voltageV: form.pv.dcBusVoltage,
    crossSectionMm2: form.cable.crossSectionMm2,
    material: form.cable.material
  });
  const acCableSingle = calculateACCableSinglePhase({
    lengthM: options.acLengthM ?? 15,
    currentA: form.inverter.ratedPowerW / 230,
    voltageV: 230,
    crossSectionMm2: options.acCrossSectionMm2 ?? 10
  });
  const acCableThree = calculateACCableThreePhase({
    lengthM: options.acLengthM ?? 15,
    currentA: form.inverter.ratedPowerW / (Math.sqrt(3) * 400),
    voltageV: 400,
    crossSectionMm2: options.acCrossSectionMm2 ?? 10
  });
  const batteryLifecycle = estimateBatteryLifecycle({
    chemistry: options.batteryChemistry || "LFP",
    depthOfDischarge: form.battery.depthOfDischarge,
    averageTemperatureC: options.averageTemperatureC ?? 25
  });

  return {
    solarGeometry: {
      latitude,
      tilt,
      monthlyTiltFactors
    },
    shading,
    cables: {
      dc: dcCable,
      acSinglePhase: acCableSingle,
      acThreePhase: acCableThree
    },
    batteryLifecycle
  };
}
