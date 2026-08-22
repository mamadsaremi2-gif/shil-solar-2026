import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ShilProjectService } from "../../src/services/ShilProjectService.js";
import { ProductionReadinessService } from "../../src/qa/ProductionReadinessService.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const service = new ShilProjectService(storage);
await service.initialize();

const readiness = new ProductionReadinessService({ storage, projectService: service });
const report = await readiness.runReadinessCheck();

assert(report.health.ok === true, "Health checks should pass.");
assert(report.counts.projects === 0, "Readiness report should count projects.");
assert(report.ok === true, "Readiness report should be ok with no unresolved errors.");

console.log("healthCheck.test passed");
