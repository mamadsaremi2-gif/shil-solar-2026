export function runEngineeringPipeline(form = {}, options = {}) {
  return { status: "disabled", valid: true, canContinue: true, form, options, outputs: {}, warnings: [], explanations: ["Engineering pipeline disabled for clean rebuild."] };
}
