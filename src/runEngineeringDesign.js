import { runFinalCalculationGateway } from "./calculationGateway/unifiedFinalCalculationGateway.js";

export function runEngineeringDesign(form = {}, options = {}) {
  const domain = options.domain || form.designDomain || form.domain || form.project?.scenario || "solar";
  if (domain === "emergency") {
    return runFinalCalculationGateway({ ...form, project: { ...(form.project || {}), scenario: "emergency" } }, options);
  }
  return runFinalCalculationGateway(form, { ...options, domain });
}
