import assert from "node:assert/strict";
import { APP_META } from "../../src/shared/constants/appMeta.js";

assert.equal(APP_META.corePackageVersion, "2.0.0-infrastructure");
console.log("structure.test passed");
