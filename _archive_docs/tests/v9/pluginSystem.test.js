import { PluginRegistry } from "../../src/plugins/PluginRegistry.js";
import { performanceRatioPlugin } from "../../src/plugins/builtins/performanceRatioPlugin.js";
import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const registry = new PluginRegistry();
registry.register(performanceRatioPlugin);

assert(registry.list().length === 1, "Plugin registry should list registered plugin.");

const form = createValidOffgridFixture();
const result = runEngineeringPipeline(form);
const hook = await registry.runHook("calculation:after", { form, result });

assert(hook.context.result.outputs.pluginMetrics.performanceRatio > 0, "Plugin should add performance ratio.");
registry.unregister(performanceRatioPlugin.id);
assert(registry.list().length === 0, "Plugin registry should unregister plugin.");

console.log("pluginSystem.test passed");
