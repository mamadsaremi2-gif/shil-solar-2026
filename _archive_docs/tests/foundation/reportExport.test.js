import { createValidOffgridFixture, assert } from "../fixtures.js";
import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { exportReport } from "../../src/reporting/reportExporters.js";

const form = createValidOffgridFixture();
const result = runEngineeringPipeline(form);

const json = exportReport(form, result, "json");
const markdown = exportReport(form, result, "markdown");
const csv = exportReport(form, result, "csv");

assert(JSON.parse(json).meta.title === "Test Offgrid Project", "JSON export should parse.");
assert(markdown.includes("SHIL Engineering Report"), "Markdown export should include title.");
assert(csv.includes("dailyEnergyKWh"), "CSV export should include summary field.");

console.log("reportExport.test passed");
