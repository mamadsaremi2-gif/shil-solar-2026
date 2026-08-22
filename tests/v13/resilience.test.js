import { RetryPolicy } from "../../src/production/resilience/RetryPolicy.js";
import { CircuitBreaker } from "../../src/production/resilience/CircuitBreaker.js";
import { RecoveryPlaybookService } from "../../src/production/resilience/RecoveryPlaybookService.js";
import { ErrorBudgetService } from "../../src/production/reliability/ErrorBudgetService.js";
import { assert } from "../fixtures.js";

let attempts = 0;
const retry = new RetryPolicy({ retries: 2, baseDelayMs: 1 });
const result = await retry.run(async () => {
  attempts += 1;
  if (attempts < 2) throw new Error("fail once");
  return "ok";
});
assert(result.ok === true && result.attempts === 2, "Retry policy should retry failed operation.");

const breaker = new CircuitBreaker({ failureThreshold: 2, resetAfterMs: 99999 });
try { await breaker.run(async () => { throw new Error("x"); }); } catch {}
try { await breaker.run(async () => { throw new Error("x"); }); } catch {}
assert(breaker.snapshot().state === "open", "Circuit breaker should open after threshold.");

const playbooks = new RecoveryPlaybookService();
assert(playbooks.get("SYNC_FAILURE").length > 0, "Recovery playbook should return steps.");

const budget = new ErrorBudgetService({ sloPercent: 90 });
budget.recordSuccess();
budget.recordFailure();
assert(budget.snapshot().healthy === false, "Error budget should detect unhealthy rate.");

console.log("resilience.test passed");
