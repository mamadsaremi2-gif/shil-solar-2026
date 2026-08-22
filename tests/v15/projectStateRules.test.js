import { resolveProjectBucket, finalizeProject, keepProjectInProgress } from "../../src/ui/v15/projectStateRules.js";
function assert(c, m) { if (!c) throw new Error(m); }

const p1 = keepProjectInProgress({ id: "p1" }, "systemSettings");
assert(resolveProjectBucket(p1) === "inProgressProjects", "Incomplete project remains in progress");

const p2 = finalizeProject({ id: "p2" });
assert(resolveProjectBucket(p2) === "finalProjects", "Completed project moves to final");

console.log("V15 project state rules test passed");
