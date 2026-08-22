export function buildEngineeringCalculationReport(form, result) {
  const outputs = result.outputs || {};
  const advanced = outputs.advanced || {};
  const protection = outputs.protection || {};
  const climate = outputs.climate || null;

  return {
    meta: {
      title: form.project.title,
      scenario: form.project.scenario,
      generatedAt: result.generatedAt,
      calculationCoreVersion: "12.0.0"
    },
    electrical: {
      pvArrayPowerW: outputs.pv?.arrayPowerW || 0,
      pvStringVmp: outputs.pv?.stringVoltageVmp || 0,
      pvStringVoc: outputs.pv?.stringVoltageVoc || 0,
      inverterRatedPowerW: form.inverter.ratedPowerW,
      dcCableDropPercent: advanced.cables?.dc?.voltageDropPercent ?? outputs.cable?.voltageDropPercent,
      acSinglePhaseDropPercent: advanced.cables?.acSinglePhase?.voltageDropPercent ?? null,
      acThreePhaseDropPercent: advanced.cables?.acThreePhase?.voltageDropPercent ?? null
    },
    battery: {
      usableEnergyWh: outputs.battery?.usableEnergyWh || 0,
      autonomyCoverageDays: outputs.battery?.autonomyCoverageDays || 0,
      lifecycle: advanced.batteryLifecycle || null
    },
    protection: {
      pvStringFuse: protection.pvStringFuse || null,
      dcBreaker: protection.dcBreaker || null,
      acBreaker: protection.acBreaker || null,
      spd: protection.spd || null
    },
    solar: {
      tilt: advanced.solarGeometry?.tilt ?? null,
      shading: advanced.shading || null,
      climateWorstMonth: climate?.worstMonth || null
    },
    diagnostics: result.diagnostics || [],
    quality: result.quality || null,
    trace: result.trace || []
  };
}
