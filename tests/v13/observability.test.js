import { MetricsCollector } from "../../src/production/observability/MetricsCollector.js";
import { EventLogService } from "../../src/production/observability/EventLogService.js";
import { TraceService } from "../../src/production/observability/TraceService.js";
import { assert } from "../fixtures.js";

const metrics = new MetricsCollector();
metrics.timing("calculationMs", 100);
metrics.timing("calculationMs", 200);
assert(metrics.summarize("calculationMs").avg === 150, "Metrics should summarize average.");

const logs = new EventLogService();
logs.info("hello");
logs.error("bad");
assert(logs.countByLevel().error === 1, "Logs should count by level.");

const traces = new TraceService();
const id = traces.start("test");
traces.span(id, "middle");
const ended = traces.end(id);
assert(ended.durationMs >= 0, "Trace should record duration.");
assert(ended.spans.length === 1, "Trace should record spans.");

console.log("observability.test passed");
