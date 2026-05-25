import { runEngineeringDesign } from "../runEngineeringDesign.js";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstMpptLayout(result = {}) {
  return result?.mpptSystem?.per_MPPT_panels?.[0]?.layout || result?.layout || {};
}

export function runUnifiedEngineForLegacyUI(input = {}, options = {}) {
  const result = runEngineeringDesign(input, {
    ...options,
    domain: options.domain || input?.designDomain || input?.domain || input?.project?.scenario || "solar",
    source: options.source || "legacy-ui-adapter",
  });

  return toLegacyEngineeringResult(result);
}

export function toLegacyEngineeringResult(result = {}) {
  const solarDesign = result.solarDesign || {};
  const layout = firstMpptLayout(result);
  const protection = result.protection || {};
  const efficiency = result.efficiency || {};
  const input = result.input || {};
  const battery = solarDesign.battery || {};
  const inverter = solarDesign.inverter || {};
  const panelCount = number(result?.result?.panelCount, number(solarDesign?.pvArray?.panelCount, 0));
  const arrayPowerW = number(result?.result?.arrayPowerW, number(solarDesign?.pvArray?.arrayPowerW, 0));
  const recommendedInverterW = number(inverter.ratedPowerW, number(input?.inverter?.ratedPowerW, 0));
  const systemEta = number(result?.result?.systemEta, number(efficiency?.eta_system_no_battery, 0));
  const totalLoss = systemEta > 0 && systemEta <= 1 ? Math.round((1 - systemEta) * 1000) / 10 : number(efficiency?.losses?.totalLossPercent, 0);

  return {
    engine: result.engine || "SHIL_Unified_Final_Calculation_Gateway",
    status: result.valid ? "ENGINEERING PASS" : "NEEDS REVIEW",
    valid: Boolean(result.valid),
    canContinue: Boolean(result.canContinue),
    generatedAt: new Date().toISOString(),
    source: "unified-final-gateway-adapter",
    pv: {
      panelCount,
      arrayPowerW,
      seriesCount: number(solarDesign?.pvArray?.seriesCount, number(layout.n_series, 0)),
      parallelCount: number(solarDesign?.pvArray?.parallelCount, number(layout.n_parallel, 0)),
    },
    string: {
      status: result.valid ? "PASS" : "REVIEW",
      vmpString: number(layout.Vmp_string, number(layout.Vmp_string_STC, 0)),
      vocString: number(layout.Voc_string_cold, number(layout.Voc_string_STC, 0)),
      connectionType: layout.connection_type || result?.summary?.important_results?.connection_type || null,
    },
    battery: {
      batteryCount: number(battery.totalCount, number(battery.count, 0)),
      totalCount: number(battery.totalCount, number(battery.count, 0)),
      voltageV: number(battery.unitVoltageV, number(input?.battery?.nominalVoltage, 0)),
      unitVoltageV: number(battery.unitVoltageV, number(input?.battery?.nominalVoltage, 0)),
      batteryAh: number(battery.unitCapacityAh, number(input?.battery?.capacityAh, 0)),
      capacityAh: number(battery.unitCapacityAh, number(input?.battery?.capacityAh, 0)),
      unitCapacityAh: number(battery.unitCapacityAh, number(input?.battery?.capacityAh, 0)),
      batteryKWh: number(battery.grossEnergyKWh, 0),
      grossEnergyKWh: number(battery.grossEnergyKWh, 0),
    },
    inverter: {
      recommendedInverterW,
      ratedPowerW: recommendedInverterW,
      title: inverter.title || input?.inverter?.model_name || "SHIL Inverter",
    },
    cable: {
      voltageDropPercent: number(efficiency?.loss_breakdown?.DC_cable_loss_percent, 0),
      status: "PASS",
      dcCable: solarDesign?.protection?.dcCable || null,
      pvCable: solarDesign?.protection?.pvCable || null,
      batteryCable: solarDesign?.protection?.batteryCable || null,
    },
    losses: {
      efficiency: Math.round(systemEta * 1000) / 10,
      totalLoss,
      status: totalLoss <= 25 ? "GOOD" : "REVIEW",
    },
    warnings: result.warnings || [],
    explanations: result.explanations || [],
    raw: result,
  };
}
