import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { PERMISSIONS } from "../../src/auth/roles.js";
import { assert } from "../fixtures.js";

const app = new ShilAppKernel();
const init = await app.initialize();

assert(init.settings.locale === "fa-IR", "App kernel should initialize settings.");
assert(init.readiness.health.ok === true, "App kernel should initialize readiness service.");
assert(app.permissions.can(PERMISSIONS.PROJECT_CREATE) === true, "Default kernel role should allow project create.");

console.log("appKernel.test passed");
