import { createEmptyEngineeringResult } from "../contracts/engineeringResult.contract.js";
import { validateBySchema } from "../schema/schemaValidator.js";
import { runEnginePipeline } from "../pipeline/runEnginePipeline.js";
import { validateEngineeringResult } from "../validation/engineeringValidation.js";

const defaultStages = [
  { key: "loads", optional: false, run: async (form) => ({ inputMode: form.calculationMethod?.method || null, items: [], totalDailyWh: 0 }) },
  { key: "climate", optional: true, run: async (form) => ({ city: form.environment?.city || null, source: "pending-dataset" }) },
  { key: "pv", optional: true, run: async (form) => ({ scenario: form.projectPath?.pvScenario || null, recommendedPowerWp: 0 }) },
  { key: "battery", optional: true, run: async () => ({ recommendedCapacityWh: 0 }) },
  { key: "inverter", optional: true, run: async () => ({ recommendedPowerW: 0 }) },
  { key: "controller", optional: true, run: async () => ({ type: null, currentA: 0 }) },
  { key: "cabling", optional: true, run: async () => ({ sections: [] }) },
  { key: "losses", optional: true, run: async () => ({ totalPercent: 0, items: [] }) },
  { key: "shadow", optional: true, run: async () => ({ status: "not-evaluated" }) },
  { key: "voltageCorrection", optional: true, run: async (form) => ({ dcVoltage: form.systemSettings?.dcVoltage || null }) },
];

export async function runEngineeringDesign(form, options = {}) {
  const startedAt = performanceNow();
  const base = createEmptyEngineeringResult(form);
  const schemaValidation = validateBySchema(form);

  if (!schemaValidation.ok) {
    return finalizeResult({
      ...base,
      ok: false,
      validation: { score: 0, grade: "invalid-input", checks: schemaValidation.checks },
    }, startedAt);
  }

  const stages = options.stages || defaultStages;
  const pipelineResult = await runEnginePipeline({ form, result: base, stages });
  const validation = validateEngineeringResult(pipelineResult);

  return finalizeResult({
    ...pipelineResult,
    ok: pipelineResult.ok && validation.grade !== "blocked",
    validation,
    advisor: buildAdvisorMessages(pipelineResult, validation),
  }, startedAt);
}

function finalizeResult(result, startedAt) {
  const finishedAt = performanceNow();
  return {
    ...result,
    meta: {
      ...(result.meta || {}),
      startedAt: new Date(Date.now() - (finishedAt - startedAt)).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Math.max(0, Math.round(finishedAt - startedAt)),
    },
  };
}

function buildAdvisorMessages(result, validation) {
  const messages = [];
  if ((result.warnings || []).length) messages.push({ level: "warning", text: "Ø¨Ø±Ø®ÛŒ EngineÙ‡Ø§ Ù‡Ù†ÙˆØ² Ø®Ø±ÙˆØ¬ÛŒ Ù‚Ø·Ø¹ÛŒ Ù†Ø¯Ø§Ø±Ù†Ø¯ ÛŒØ§ Ø§Ø®ØªÛŒØ§Ø±ÛŒ Ø§Ø¬Ø±Ø§ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯." });
  if (validation.grade === "invalid-input") messages.push({ level: "error", text: "ÙˆØ±ÙˆØ¯ÛŒâ€ŒÙ‡Ø§ Ù‚Ø¨Ù„ Ø§Ø² Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø¨Ø§ÛŒØ¯ Ø§ØµÙ„Ø§Ø­ Ø´ÙˆÙ†Ø¯." });
  return messages;
}

function performanceNow() {
  if (typeof performance !== "undefined" && performance.now) return performance.now();
  return Date.now();
}
