import { runEngineeringPipeline } from "./engines/pipeline/engineeringPipeline.js";

export function runEngineeringDesign(form, options) {
  return runEngineeringPipeline(form, options);
}
