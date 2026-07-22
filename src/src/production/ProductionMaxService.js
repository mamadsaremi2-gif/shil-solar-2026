import { EnvironmentService } from "./environment/EnvironmentService.js";
import { FeatureFlagService } from "./flags/FeatureFlagService.js";
import { MetricsCollector } from "./observability/MetricsCollector.js";
import { EventLogService } from "./observability/EventLogService.js";
import { TraceService } from "./observability/TraceService.js";
import { ErrorBudgetService } from "./reliability/ErrorBudgetService.js";
import { RetryPolicy } from "./resilience/RetryPolicy.js";
import { CircuitBreaker } from "./resilience/CircuitBreaker.js";
import { RecoveryPlaybookService } from "./resilience/RecoveryPlaybookService.js";
import { DeploymentReadinessService } from "./deployment/DeploymentReadinessService.js";
import { PerformanceBudgetService } from "./performance/PerformanceBudgetService.js";
import { ReleaseManifestBuilder } from "./release/ReleaseManifestBuilder.js";
import { RollbackManager } from "./release/RollbackManager.js";

export class ProductionMaxService {
  constructor({ storage, appKernel, environment = "production", packageJson = {} } = {}) {
    this.storage = storage;
    this.appKernel = appKernel;
    this.environment = new EnvironmentService(environment);
    this.flags = new FeatureFlagService();
    this.metrics = new MetricsCollector();
    this.logs = new EventLogService();
    this.traces = new TraceService();
    this.errorBudget = new ErrorBudgetService({ sloPercent: 99 });
    this.retry = new RetryPolicy();
    this.circuitBreaker = new CircuitBreaker();
    this.playbooks = new RecoveryPlaybookService();
    this.performanceBudget = new PerformanceBudgetService({
      calculationMs: this.environment.getPerformanceBudgetMs()
    });
    this.releaseBuilder = new ReleaseManifestBuilder({
      version: packageJson.version || "13.0.0",
      packageName: packageJson.name || "shil",
      environment
    });
    this.rollback = storage ? new RollbackManager(storage) : null;
    this.deployment = new DeploymentReadinessService({
      environmentService: this.environment,
      runtimeService: appKernel?.runtime,
      qualityGates: appKernel?.qualityGates,
      metrics: this.metrics,
      errorBudget: this.errorBudget
    });
  }

  async observeCalculation(projectId, fn) {
    const traceId = this.traces.start("calculation", { projectId });
    const start = performance.now();

    try {
      this.traces.span(traceId, "calculation:start");
      const result = await this.circuitBreaker.run(fn);
      const durationMs = performance.now() - start;
      this.metrics.timing("calculationMs", durationMs, { projectId });
      this.traces.span(traceId, "calculation:success", { durationMs });
      this.traces.end(traceId);
      this.errorBudget.recordSuccess();
      return result;
    } catch (error) {
      const durationMs = performance.now() - start;
      this.metrics.timing("calculationMs", durationMs, { projectId, failed: true });
      this.logs.error("Calculation failed", { projectId, code: error.code, message: error.message });
      this.traces.span(traceId, "calculation:failure", { message: error.message });
      this.traces.end(traceId);
      this.errorBudget.recordFailure();
      throw error;
    }
  }

  async release({ testOutput = "", checks = {}, artifacts = [] } = {}) {
    const manifest = this.releaseBuilder.build({ testOutput, checks, artifacts });
    if (this.rollback) await this.rollback.recordRelease(manifest);
    return manifest;
  }

  async readiness(input = {}) {
    return this.deployment.evaluate(input);
  }

  status() {
    return {
      environment: this.environment.getProfile(),
      environmentSafe: this.environment.assertProductionSafe(),
      flags: this.flags.snapshot(),
      metrics: {
        calculationMs: this.metrics.summarize("calculationMs")
      },
      errorBudget: this.errorBudget.snapshot(),
      circuitBreaker: this.circuitBreaker.snapshot(),
      logsByLevel: this.logs.countByLevel(),
      traces: this.traces.list().length
    };
  }
}
