export const performanceRatioPlugin = {
  id: "builtin.performance-ratio",
  name: "Performance Ratio Plugin",
  version: "1.0.0",
  capabilities: ["calculation:post-process"],
  hooks: {
    "calculation:after": async ({ form, result }) => {
      const pvEnergy = result.outputs?.pv?.estimatedDailyEnergyWh || 0;
      const theoretical = (result.outputs?.pv?.arrayPowerW || 0) * (form.environment?.peakSunHours || 0);
      const performanceRatio = theoretical > 0 ? pvEnergy / theoretical : 0;

      return {
        context: {
          form,
          result: {
            ...result,
            outputs: {
              ...result.outputs,
              pluginMetrics: {
                ...(result.outputs?.pluginMetrics || {}),
                performanceRatio
              }
            }
          }
        }
      };
    }
  }
};
