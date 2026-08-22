export class CircuitBreaker {
  constructor({ failureThreshold = 3, resetAfterMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.resetAfterMs = resetAfterMs;
    this.failures = 0;
    this.state = "closed";
    this.openedAt = null;
  }

  canRun() {
    if (this.state === "closed") return true;
    if (this.state === "open" && Date.now() - this.openedAt >= this.resetAfterMs) {
      this.state = "half-open";
      return true;
    }
    return this.state === "half-open";
  }

  success() {
    this.failures = 0;
    this.state = "closed";
    this.openedAt = null;
  }

  failure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  async run(fn) {
    if (!this.canRun()) {
      const error = new Error("Circuit breaker is open.");
      error.code = "CIRCUIT_OPEN";
      throw error;
    }

    try {
      const result = await fn();
      this.success();
      return result;
    } catch (error) {
      this.failure();
      throw error;
    }
  }

  snapshot() {
    return {
      state: this.state,
      failures: this.failures,
      failureThreshold: this.failureThreshold,
      openedAt: this.openedAt
    };
  }
}
