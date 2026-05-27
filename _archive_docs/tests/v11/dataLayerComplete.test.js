import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ProjectRepository } from "../../src/data/repositories/ProjectRepository.js";
import { ProjectIndexService } from "../../src/data/indexes/ProjectIndexService.js";
import { TransactionManager } from "../../src/data/transactions/TransactionManager.js";
import { DataSchemaValidator } from "../../src/data/validation/DataSchemaValidator.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const repo = new ProjectRepository(storage);

const p1 = await repo.createProject({ title: "P1", form: createValidOffgridFixture() });
const p2 = await repo.createProject({ title: "P2", form: createValidOffgridFixture({ project: { title: "Hybrid", scenario: "hybrid", location: "X", dailyEnergyWh: 12000, peakLoadW: 2500, autonomyDays: 1 } }) });
await repo.updateProject(p2.id, { status: "calculated" });

const index = new ProjectIndexService(storage);
await index.rebuild(await repo.listProjects({ includeDeleted: true }));

const calculated = await index.query({ status: "calculated" });
assert(calculated.includes(p2.id), "Project index should query by status.");

const transaction = new TransactionManager(storage);
const tx = await transaction.transaction([
  { type: "set", key: "tx:a", value: { ok: true } },
  { type: "set", key: "tx:b", value: { ok: true } }
]);
assert(tx.ok === true, "Transaction manager should apply operations.");
assert((await storage.getItem("tx:a")).ok === true, "Transaction should persist operation.");

const validator = new DataSchemaValidator();
assert(validator.validateProject(p1).valid === true, "Schema validator should validate project.");
assert(validator.validateProject({}).valid === false, "Schema validator should catch invalid project.");

console.log("dataLayerComplete.test passed");
