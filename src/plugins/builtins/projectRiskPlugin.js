export const projectRiskPlugin = {
  id: "builtin.project-risk",
  name: "Project Risk Plugin",
  version: "1.0.0",
  capabilities: ["diagnostics:risk-score"],
  hooks: {
    "calculation:after": async ({ form, result }) => {
      const warnings = result.warnings?.length || 0;
      const errors = result.errors?.length || 0;
      const diagnostics = result.diagnostics?.length || 0;
      const riskScore = Math.min(100, errors * 40 + warnings * 10 + diagnostics * 8);

      return {
        context: {
          form,
          result: {
            ...result,
            risk: {
              score: riskScore,
              level: riskScore >= 70 ? "high" : riskScore >= 30 ? "medium" : "low"
            }
          }
        }
      };
    }
  }
};
