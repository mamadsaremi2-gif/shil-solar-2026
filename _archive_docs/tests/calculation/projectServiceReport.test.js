import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ShilProjectService } from "../../src/services/ShilProjectService.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const service = new ShilProjectService(new MemoryStorageAdapter());
await service.initialize();

const project = await service.createProject({
  title: "Report Service Test",
  form: createValidOffgridFixture()
});

await service.calculateProject(project.id);
const report = await service.buildReport(project.id);
const markdown = await service.buildReport(project.id, "markdown");

assert(report.summary.pvArrayKWp === 4.4, "Service should build object report.");
assert(markdown.includes("SHIL Engineering Report"), "Service should build markdown report.");

console.log("projectServiceReport.test passed");
