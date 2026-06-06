export class PerformanceBudgetService {
  constructor(budgets = {}) {
    this.budgets = {
      calculationMs: 750,
      appInitMs: 1000,
      backupMs: 1500,
      syncMs: 2000,
      ...budgets
    };
  }

  evaluate(measurements = {}) {
    const failures = [];
    const warnings = [];

    for (const [name, budget] of Object.entries(this.budgets)) {
      const value = measurements[name];
      if (value === undefined) continue;

      if (value > budget) {
        failures.push({ code: "PERFORMANCE_BUDGET_EXCEEDED", name, value, budget });
      } else if (value > budget * 0.8) {
        warnings.push({ code: "PERFORMANCE_BUDGET_NEAR_LIMIT", name, value, budget });
      }
    }

    return {
      passed: failures.length === 0,
      failures,
      warnings,
      budgets: { ...this.budgets }
    };
  }
}
