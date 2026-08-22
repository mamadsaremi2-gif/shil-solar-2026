import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ShilProjectService } from "../../src/services/ShilProjectService.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const service = new ShilProjectService(new MemoryStorageAdapter());
await service.initialize();

const project = await service.createProject({
  title: "Service Test",
  form: createValidOffgridFixture()
});

const result = await service.calculateProject(project.id);

assert(result.valid === true, "Service should calculate valid project.");
assert(result.outputs.pv.arrayPowerW === 4400, "Service result should include PV output.");

const syncReport = await service.processSync({
  "project:create": async () => true,
  "project:result": async () => true
});

assert(syncReport.done >= 2, "Service should process queued sync operations.");

console.log("shilProjectService.test passed");
