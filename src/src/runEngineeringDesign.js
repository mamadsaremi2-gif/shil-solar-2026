import { runEngineeringPipeline } from "./engineering/index.js";

export function runEngineeringDesign(form = {}, options = {}) {
  return runEngineeringPipeline(form, options);
}

export default runEngineeringDesign;
