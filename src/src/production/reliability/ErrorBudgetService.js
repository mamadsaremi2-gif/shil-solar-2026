export class ErrorBudgetService {
  constructor({ sloPercent = 99, windowLabel = "release" } = {}) {
    this.sloPercent = sloPercent;
    this.windowLabel = windowLabel;
    this.total = 0;
    this.failures = 0;
  }

  recordSuccess() {
    this.total += 1;
    return this.snapshot();
  }

  recordFailure() {
    this.total += 1;
    this.failures += 1;
    return this.snapshot();
  }

  snapshot() {
    const successRate = this.total > 0 ? ((this.total - this.failures) / this.total) * 100 : 100;
    const errorRate = 100 - successRate;
    const allowedErrorRate = 100 - this.sloPercent;
    return {
      windowLabel: this.windowLabel,
      sloPercent: this.sloPercent,
      total: this.total,
      failures: this.failures,
      successRate,
      errorRate,
      allowedErrorRate,
      budgetRemainingPercent: Math.max(0, allowedErrorRate - errorRate),
      healthy: errorRate <= allowedErrorRate
    };
  }
}
