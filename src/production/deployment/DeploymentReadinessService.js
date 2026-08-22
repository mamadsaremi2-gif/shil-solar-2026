export class DeploymentReadinessService {
  constructor({
    environmentService,
    runtimeService,
    qualityGates,
    metrics,
    errorBudget
  } = {}) {
    this.environmentService = environmentService;
    this.runtimeService = runtimeService;
    this.qualityGates = qualityGates;
    this.metrics = metrics;
    this.errorBudget = errorBudget;
  }

  async evaluate({ readiness, lastResult, projectCount = 0, syncQueueItems = 0 } = {}) {
    const failures = [];
    const env = this.environmentService?.assertProductionSafe?.() || { safe: true, issues: [] };
    if (!env.safe) failures.push(...env.issues);

    if (readiness && !readiness.ok) failures.push({ code: "READINESS_NOT_OK" });

    if (lastResult && this.qualityGates) {
      const q = this.qualityGates.evaluateResult(lastResult);
      if (!q.passed) failures.push(...q.failures);
    }

    if (this.runtimeService) {
      const limits = this.runtimeService.enforceLimits({ projectCount, syncQueueItems });
      if (!limits.ok) failures.push(...limits.violations);
    }

    const budget = this.errorBudget?.snapshot?.();
    if (budget && !budget.healthy) failures.push({ code: "ERROR_BUDGET_EXHAUSTED", budget });

    return {
      deployable: failures.length === 0,
      failures,
      evaluatedAt: new Date().toISOString()
    };
  }
}
