import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ShilProjectService } from "../../src/services/ShilProjectService.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const source = new ShilProjectService(new MemoryStorageAdapter());
await source.initialize();

const project = await source.createProject({
  title: "Portable Project",
  form: createValidOffgridFixture()
});

const exported = await source.exportProject(project.id);
assert(exported.format === "SHIL_PROJECT_EXPORT", "Export should use SHIL format.");
assert(exported.checksum, "Export should include checksum.");

const target = new ShilProjectService(new MemoryStorageAdapter());
await target.initialize();
const imported = await target.importProject(exported);

assert(imported.id === project.id, "Import should preserve project id.");
assert(imported.form.project.title === "Test Offgrid Project", "Import should preserve form.");

console.log("importExport.test passed");
