import { validateEngineeringForm } from "../../validation/engineering/validationEngine.js";
import { runPVEngine } from "../pv/pvEngine.js";
import { runBatteryEngine } from "../battery/batteryEngine.js";
import { runInverterEngine } from "../inverter/inverterEngine.js";
import { runCableEngine } from "../cable/cableEngine.js";
import { evaluateScenario } from "../../calculation/scenarios/scenarioStrategyFactory.js";
import { ClimateEngine } from "../../climate/ClimateEngine.js";
import { runAdvancedEngineering } from "../../engineering/advanced/advancedEngineeringEngine.js";

function diagnosticList(form, outputs, errors, warnings) {
  const items = [];
  if ((outputs.pv?.estimatedDailyEnergyWh || 0) < (form.project?.dailyEnergyWh || 0)) {
    items.push({ code: "ENERGY_DEFICIT", severity: "warning", message: "PV daily energy is below daily demand." });
  }
  if (outputs.inverter && !outputs.inverter.hasCapacityMargin) {
    items.push({ code: "INVERTER_MARGIN_LOW", severity: "warning", message: "Selected inverter has insufficient capacity margin." });
  }
  if (outputs.cable && !outputs.cable.withinLimit) {
    items.push({ code: "CABLE_DROP_HIGH", severity: "warning", message: "Cable voltage drop exceeds the configured limit." });
  }
  return [...items, ...errors, ...warnings];
}

export function runEngineeringPipeline(form = {}, options = {}) {
  const validation = validateEngineeringForm(form);
  if (!validation.valid && options.stopOnValidationError !== false) {
    return {
      status: "needs-review",
      valid: false,
      canContinue: false,
      outputs: {},
      errors: validation.errors,
      warnings: validation.warnings,
      diagnostics: [...validation.errors, ...validation.warnings],
      trace: ["validation"],
      health: { score: Math.max(0, 100 - validation.errors.length * 25 - validation.warnings.length * 5) },
    };
  }

  const pv = runPVEngine(form);
  const battery = runBatteryEngine(form, options);
  const inverter = runInverterEngine(form);
  const cable = runCableEngine(form);
  const outputs = { pv, battery, inverter, cable };
  const trace = ["engine:pv", "engine:battery", "engine:inverter", "engine:cable"];

  try {
    outputs.scenario = evaluateScenario(form, outputs);
    trace.push("engine:scenario");
  } catch (error) {
    validation.errors.push({ code: "SCENARIO_ERROR", severity: "error", message: error?.message || String(error) });
  }

  if (options.climateCityId) {
    try {
      const climate = new ClimateEngine();
      outputs.climate = {
        summary: climate.summarize(options.climateCityId),
        monthlyPV: climate.estimateMonthlyPV(form, options.climateCityId),
        worstMonth: climate.findWorstMonth(options.climateCityId),
      };
      trace.push("engine:climate-monthly");
    } catch (error) {
      validation.warnings.push({ code: "CLIMATE_ERROR", severity: "warning", message: error?.message || String(error) });
    }
  }

  try {
    outputs.advanced = runAdvancedEngineering(form, options.advanced || options);
    trace.push("engine:advanced");
  } catch (error) {
    validation.warnings.push({ code: "ADVANCED_ENGINE_ERROR", severity: "warning", message: error?.message || String(error) });
  }

  const errors = [...validation.errors, ...(Array.isArray(battery?.errors) ? battery.errors : [])];
  const warnings = [...validation.warnings, ...(Array.isArray(battery?.warnings) ? battery.warnings : [])];
  const diagnostics = diagnosticList(form, outputs, errors, warnings);
  const valid = errors.length === 0;
  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 5 - diagnostics.filter((d) => d?.code === "ENERGY_DEFICIT").length * 10);

  return {
    status: valid ? "success" : "needs-review",
    valid,
    canContinue: valid || options.stopOnValidationError === false,
    input: form,
    outputs,
    errors,
    warnings,
    diagnostics,
    trace,
    health: { score },
  };
}

export default runEngineeringPipeline;
