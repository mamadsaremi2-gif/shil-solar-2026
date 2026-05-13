import { validateEngineeringForm } from "../../validation/engineering/validationEngine.js";
import { createEngineeringResult } from "../../contracts/engineeringResultContract.js";
import { runLoadEngine } from "../load/loadEngine.js";
import { runPVEngine } from "../pv/pvEngine.js";
import { runBatteryEngine } from "../battery/batteryEngine.js";
import { runInverterEngine } from "../inverter/inverterEngine.js";
import { runCableEngine } from "../cable/cableEngine.js";
import { runLossEngine } from "../loss/lossEngine.js";
import { runControllerEngine } from "../controller/controllerEngine.js";
import { evaluateScenario } from "../../calculation/scenarios/scenarioStrategyFactory.js";
import { runSystemSizing } from "../../calculation/sizing/systemSizingEngine.js";
import { attachDiagnostics } from "../../calculation/diagnostics/diagnosticEngine.js";
import { ClimateEngine } from "../../climate/ClimateEngine.js";
import { runProtectionSizing } from "../../protection/ProtectionSizingEngine.js";
import { runAdvancedEngineering } from "../../engineering/advanced/advancedEngineeringEngine.js";

const ENGINE_STEPS = [
  ["load", runLoadEngine],
  ["loss", runLossEngine],
  ["pv", runPVEngine],
  ["battery", runBatteryEngine],
  ["inverter", runInverterEngine],
  ["cable", runCableEngine],
  ["controller", runControllerEngine]
];

export function runEngineeringPipeline(form, options = {}) {
  const validation = validateEngineeringForm(form);

  if (!validation.valid && options.stopOnValidationError !== false) {
    return createEngineeringResult({
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
      outputs: {},
      trace: ["validation_failed"]
    });
  }

  const outputs = {};
  const trace = [];

  for (const [name, engine] of ENGINE_STEPS) {
    outputs[name] = engine(form);
    trace.push(`engine:${name}`);
  }

  outputs.scenario = evaluateScenario(form, outputs);
  trace.push(`scenario:${form.project.scenario}`);

  outputs.sizing = runSystemSizing(form, options.selection || {});
  trace.push("engine:sizing");

  outputs.protection = runProtectionSizing(form);
  trace.push("engine:protection");

  outputs.advanced = runAdvancedEngineering(form, options.advanced || {});
  trace.push("engine:advanced");

  if (options.climateCityId) {
    const climate = new ClimateEngine();
    outputs.climate = {
      summary: climate.summarize(options.climateCityId),
      monthlyPV: climate.estimateMonthlyPV(form, options.climateCityId),
      worstMonth: climate.findWorstMonth(options.climateCityId)
    };
    trace.push("engine:climate-monthly");
  }

  const result = createEngineeringResult({
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    outputs,
    trace
  });

  return attachDiagnostics(form, result);
}
