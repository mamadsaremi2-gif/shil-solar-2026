export function monitorMemory() {
  if (!performance.memory) {
    return null;
  }

  return {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit,
  };
}
