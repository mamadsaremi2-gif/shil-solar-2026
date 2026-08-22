import { EnvironmentService } from "../../src/production/environment/EnvironmentService.js";
import { assert } from "../fixtures.js";

const prod = new EnvironmentService("production");
assert(prod.isProduction() === true, "Production environment should be detected.");
assert(prod.shouldEncryptStorage() === true, "Production should require storage encryption.");
assert(prod.assertProductionSafe().safe === true, "Production profile should be safe.");

const dev = new EnvironmentService("development");
assert(dev.isProduction() === false, "Development should not be production.");
assert(dev.getPerformanceBudgetMs() > prod.getPerformanceBudgetMs(), "Development budget may be looser than production.");

console.log("environmentProfiles.test passed");
