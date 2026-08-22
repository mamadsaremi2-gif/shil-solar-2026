import { runEngineeringDesign as runUnifiedEngineeringDesign } from "../../../runEngineeringDesign.js";

export async function runEngineeringDesign(form = {}, options = {}) {
  return runUnifiedEngineeringDesign(form, {
    ...options,
    source: options.source || "core-engineering-orchestrator-facade",
  });
}
