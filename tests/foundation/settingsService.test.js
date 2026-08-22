import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { SettingsService } from "../../src/settings/SettingsService.js";
import { assert } from "../fixtures.js";

const service = new SettingsService(new MemoryStorageAdapter());
const defaults = await service.get();

assert(defaults.locale === "fa-IR", "Settings should load defaults.");

const updated = await service.update({
  defaultScenario: "hybrid",
  calculation: { stopOnValidationError: false }
});

assert(updated.defaultScenario === "hybrid", "Settings should update top-level values.");
assert(updated.calculation.stopOnValidationError === false, "Settings should update nested calculation values.");
assert(updated.sync.enabled === true, "Settings should preserve nested sync defaults.");

const reset = await service.reset();
assert(reset.defaultScenario === "offgrid", "Settings reset should restore defaults.");

console.log("settingsService.test passed");
