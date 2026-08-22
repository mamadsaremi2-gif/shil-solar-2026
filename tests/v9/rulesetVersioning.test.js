import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { RulesetService } from "../../src/rulesets/RulesetService.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const service = new RulesetService(new MemoryStorageAdapter());
const active = await service.getSelected();

assert(active.id === "shil-ruleset-2026-basic", "Ruleset service should load active ruleset.");

const conservative = await service.select("shil-ruleset-conservative");
const form = service.applyToForm(createValidOffgridFixture(), conservative);

assert(form.cable.allowedVoltageDropPercent === 2, "Conservative ruleset should apply cable drop limit.");
assert(form.battery.depthOfDischarge <= 0.75, "Conservative ruleset should limit DoD.");

console.log("rulesetVersioning.test passed");
