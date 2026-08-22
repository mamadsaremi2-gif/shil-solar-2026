export class QualityGateService {
  constructor({ minimumHealthScore = 70, maximumErrors = 0, maximumWarnings = 10, requiredTraceItems = [] } = {}) {
    this.minimumHealthScore = minimumHealthScore;
    this.maximumErrors = maximumErrors;
    this.maximumWarnings = maximumWarnings;
    this.requiredTraceItems = requiredTraceItems;
  }

  evaluateResult(result) {
    const failures = [];

    if ((result.errors?.length || 0) > this.maximumErrors) {
      failures.push({ code: "TOO_MANY_ERRORS", value: result.errors.length, limit: this.maximumErrors });
    }

    if ((result.warnings?.length || 0) > this.maximumWarnings) {
      failures.push({ code: "TOO_MANY_WARNINGS", value: result.warnings.length, limit: this.maximumWarnings });
    }

    if ((result.health?.score ?? 100) < this.minimumHealthScore) {
      failures.push({ code: "HEALTH_SCORE_LOW", value: result.health.score, limit: this.minimumHealthScore });
    }

    for (const item of this.requiredTraceItems) {
      if (!result.trace?.includes(item)) {
        failures.push({ code: "TRACE_ITEM_MISSING", item });
      }
    }

    return {
      passed: failures.length === 0,
      failures
    };
  }

  evaluateReadiness(readiness) {
    const failures = [];
    if (!readiness?.ok) failures.push({ code: "READINESS_FAILED" });
    if (readiness?.counts?.unresolvedErrors > 0) failures.push({ code: "UNRESOLVED_ERRORS", value: readiness.counts.unresolvedErrors });
    return { passed: failures.length === 0, failures };
  }
}
