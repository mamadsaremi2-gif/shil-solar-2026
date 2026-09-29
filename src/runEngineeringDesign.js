import { runEngineeringPipeline as runUnifiedEngineeringPipeline } from "./engineering/index.js";
import { runEngineeringPipeline as runLegacyEngineeringPipeline } from "./engines/pipeline/engineeringPipeline.js";

function isLegacyEngineeringForm(form = {}) {
  return Boolean(
    form?.project &&
    form?.pv &&
    form?.battery &&
    form?.inverter &&
    form?.cable &&
    Number.isFinite(Number(form?.pv?.panelPowerW)) &&
    Number.isFinite(Number(form?.pv?.seriesCount))
  );
}

export function runEngineeringDesign(form = {}, options = {}) {
  return isLegacyEngineeringForm(form)
    ? runLegacyEngineeringPipeline(form, options)
    : runUnifiedEngineeringPipeline(form, options);
}

export default runEngineeringDesign;
