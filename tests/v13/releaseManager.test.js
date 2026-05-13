import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ReleaseManifestBuilder } from "../../src/production/release/ReleaseManifestBuilder.js";
import { RollbackManager } from "../../src/production/release/RollbackManager.js";
import { assert } from "../fixtures.js";

const builder = new ReleaseManifestBuilder({
  version: "13.0.0",
  packageName: "shil-test",
  environment: "production"
});

const manifest = builder.build({
  testOutput: "All tests passed",
  checks: { ci: true },
  artifacts: ["app.zip"]
});

assert(manifest.version === "13.0.0", "Release manifest should include version.");
assert(manifest.testSummary.passed === true, "Release manifest should mark passing tests.");

const rollback = new RollbackManager(new MemoryStorageAdapter());
await rollback.recordRelease(manifest);
const target = await rollback.rollbackTarget();
assert(target.releaseId === manifest.releaseId, "Rollback manager should identify active release.");

const failed = await rollback.markFailed(manifest.releaseId, "test failure");
assert(failed.status === "failed", "Rollback manager should mark failed releases.");

console.log("releaseManager.test passed");
