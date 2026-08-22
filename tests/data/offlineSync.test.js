import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { SyncQueue } from "../../src/data/sync/SyncQueue.js";
import { processSyncQueue } from "../../src/data/sync/syncProcessor.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const queue = new SyncQueue(storage);

await queue.enqueue({ type: "project:create", payload: { id: "p1" } });
await queue.enqueue({ type: "unknown:op", payload: { id: "bad" } });

const report = await processSyncQueue(queue, {
  "project:create": async () => true
});

assert(report.processed === 2, "Sync processor should process two operations.");
assert(report.done === 1, "One operation should be done.");
assert(report.failed === 1, "One operation should fail.");
assert((await queue.pending()).length === 1, "Failed operation should remain pending for retry.");

await queue.compact();
const all = await queue.readQueue();
assert(all.length === 1, "Compaction should remove done operation.");

console.log("offlineSync.test passed");
