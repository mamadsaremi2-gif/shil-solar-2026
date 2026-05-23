export class BenchmarkService {
  constructor() {
    this.results = [];
  }

  async measure(name, fn, iterations = 1) {
    const startedAt = performance.now();
    let lastResult = null;

    for (let i = 0; i < iterations; i += 1) {
      lastResult = await fn(i);
    }

    const durationMs = performance.now() - startedAt;
    const result = {
      name,
      iterations,
      durationMs,
      averageMs: durationMs / iterations,
      createdAt: new Date().toISOString()
    };

    this.results.push(result);
    return { ...result, lastResult };
  }

  list() {
    return [...this.results];
  }

  summary() {
    return {
      count: this.results.length,
      totalMs: this.results.reduce((sum, item) => sum + item.durationMs, 0),
      slowest: [...this.results].sort((a, b) => b.durationMs - a.durationMs)[0] || null
    };
  }
}
