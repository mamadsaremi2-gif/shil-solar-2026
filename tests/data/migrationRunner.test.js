import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { MigrationRunner } from "../../src/data/migrations/MigrationRunner.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter({
  "project:legacy": {
    id: "legacy",
    title: "Legacy"
  }
});

const runner = new MigrationRunner(storage);
const report = await runner.run();
const migrated = await storage.getItem("project:legacy");

assert(report.to === 3, "Migration runner should apply latest migration.");
assert(migrated.status === "draft", "Migration should normalize project status.");
assert(migrated.version === 1, "Migration should add project version.");

console.log("migrationRunner.test passed");
