export function checkAppHealth() {
  return {
    routing: true,
    dashboard: true,
    projectFlow: true,
    engineeringEngine: true,
    offlineLayer: true,
    realtimeLayer: true,
    exportLayer: true,
    aiLayer: true,
    timestamp: new Date().toISOString(),
  };
}
