
import { AuditTrailService } from "../../src/security/AuditTrailService.js";
import { WorkflowCheckpointService } from "../../src/workflow/WorkflowCheckpointService.js";
import { QueryCacheService } from "../../src/data/cache/QueryCacheService.js";

const audit = new AuditTrailService();
audit.record("login");
if (audit.list().length !== 1) throw new Error("Audit failed");

const wf = new WorkflowCheckpointService();
wf.save("p1", "battery", { ok: true });
if (!wf.restore("p1", "battery")) throw new Error("Workflow checkpoint failed");

const cache = new QueryCacheService();
cache.set("x", 123);
if (cache.get("x") !== 123) throw new Error("Cache failed");

console.log("V14 reliability test passed");
