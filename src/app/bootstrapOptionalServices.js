const optionalBootTasks = [
  {
    name: "realtime-simulation",
    run: async () => {
      const module = await import("../realtime/streams/startRealtimeSimulation.js");
      module.startRealtimeSimulation?.();
    },
  },
  {
    name: "production-observability",
    run: async () => {
      const [webVitals, assets, globalErrors] = await Promise.all([
        import("../production/performance/webVitals.js"),
        import("../production/performance/preloadAssets.js"),
        import("../production/errors/globalErrors.js"),
      ]);

      globalErrors.registerGlobalErrorHandlers?.();
      assets.preloadCriticalAssets?.();
      webVitals.reportWebVitals?.();
    },
  },
  {
    name: "enterprise-telemetry",
    run: async () => {
      const [sentry, telemetry] = await Promise.all([
        import("../enterprise/telemetry/sentry.js"),
        import("../enterprise/telemetry/telemetry.js"),
      ]);

      sentry.initSentry?.();
      telemetry.initTelemetry?.();
    },
  },
];

export async function bootstrapOptionalServices() {
  for (const task of optionalBootTasks) {
    try {
      await task.run();
    } catch (error) {
      console.warn(`[SHIL] optional bootstrap skipped: ${task.name}`, error);
    }
  }
}
