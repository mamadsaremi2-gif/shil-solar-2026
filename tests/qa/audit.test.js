import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ProjectAuditService } from "../../src/qa/audit/ProjectAuditService.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const audit = new ProjectAuditService(storage);

await audit.record({
  actor: "tester",
  action: "update",
  entityType: "project",
  entityId: "p1",
  before: { title: "Old" },
  after: { title: "New" }
});

const entries = await audit.list({ entityId: "p1" });

assert(entries.length === 1, "Audit service should list entries.");
assert(entries[0].actor === "tester", "Audit service should preserve actor.");

console.log("audit.test passed");
