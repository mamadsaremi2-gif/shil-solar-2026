import { normalizeError } from "../../errors/errorBoundaryModel.js";

export async function runEnginePipeline({ form, result, stages }) {
  let currentResult = result;
  const warnings = [];
  const errors = [];

  for (const stage of stages) {
    try {
      const output = await stage.run(form, currentResult);
      currentResult = mergeStageOutput(currentResult, stage.key, output);
    } catch (error) {
      const normalized = normalizeError(error);
      errors.push({ stage: stage.key, ...normalized.toJSON() });
      if (!stage.optional) break;
      warnings.push({ stage: stage.key, message: normalized.message });
    }
  }

  return {
    ...currentResult,
    warnings: [...(currentResult.warnings || []), ...warnings],
    errors: [...(currentResult.errors || []), ...errors],
    ok: errors.length === 0,
  };
}

function mergeStageOutput(result, key, output) {
  if (!output) return result;
  if (output.patch) return { ...result, ...output.patch };
  return { ...result, [key]: output };
}
