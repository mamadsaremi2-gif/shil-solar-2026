import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { buildEngineeringReport, buildMarkdownEngineeringReport } from "../../src/reporting/engineeringReportBuilder.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const form = createValidOffgridFixture();
const result = runEngineeringPipeline(form);
const report = buildEngineeringReport(form, result);
const markdown = buildMarkdownEngineeringReport(form, result);

assert(report.meta.title === "Test Offgrid Project", "Report should include project title.");
assert(report.summary.pvArrayKWp === 4.4, "Report should include PV array kWp.");
assert(markdown.includes("SHIL Engineering Report"), "Markdown report should include title.");
assert(markdown.includes("Daily energy"), "Markdown report should include summary.");

console.log("reportBuilder.test passed");
