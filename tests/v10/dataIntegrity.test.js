import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { DataIntegrityService } from "../../src/data/integrity/DataIntegrityService.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
await storage.setItem("project:p1", { id: "p1", title: "Integrity" });
await storage.setItem("snapshot:s1", { id: "s1", projectId: "p1" });
await storage.setItem("snapshot:orphan", { id: "orphan", projectId: "missing" });

const integrity = new DataIntegrityService(storage);
const manifest = await integrity.createManifest("");
const verifyOk = await integrity.verifyManifest(manifest);

assert(manifest.entries.length === 3, "Integrity manifest should include all keys.");
assert(verifyOk.valid === true, "Fresh manifest should verify.");

await storage.setItem("project:p1", { id: "p1", title: "Changed" });
const verifyBad = await integrity.verifyManifest(manifest);
assert(verifyBad.valid === false, "Changed data should fail manifest verification.");

const orphans = await integrity.findOrphans();
assert(orphans.length === 1, "Integrity service should detect orphan snapshots.");

console.log("dataIntegrity.test passed");
