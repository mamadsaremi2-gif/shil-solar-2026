import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ErrorRecoveryService } from "../../src/errors/ErrorRecoveryService.js";
import { EngineeringError } from "../../src/errors/EngineeringError.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const service = new ErrorRecoveryService(storage);

const record = await service.capture(
  new EngineeringError("Cable drop too high", { code: "CABLE_VOLTAGE_DROP" }),
  { projectId: "p1" }
);

const list = await service.list();
const hint = service.getRecoveryHint(record);
const resolved = await service.resolve(record.id);

assert(list.length === 1, "Error service should list captured errors.");
assert(hint.includes("cable"), "Error service should provide recovery hint.");
assert(resolved.resolvedAt, "Error service should resolve errors.");

console.log("errorRecovery.test passed");
