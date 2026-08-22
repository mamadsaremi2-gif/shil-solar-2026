import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { TelemetryService } from "../../src/telemetry/TelemetryService.js";
import { assert } from "../fixtures.js";

const telemetry = new TelemetryService(new MemoryStorageAdapter());

await telemetry.track("app:open");
await telemetry.track("calculation:run", { projectId: "p1" });
await telemetry.track("calculation:run", { projectId: "p2" });

const summary = await telemetry.summarize();

assert(summary.total === 3, "Telemetry should count events.");
assert(summary.byName["calculation:run"] === 2, "Telemetry should group by event name.");

await telemetry.clear();
assert((await telemetry.summarize()).total === 0, "Telemetry should clear events.");

console.log("telemetry.test passed");
