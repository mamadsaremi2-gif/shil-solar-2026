export class MetricsCollector {
  constructor() {
    this.metrics = [];
  }

  record(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      createdAt: new Date().toISOString()
    };
    this.metrics.push(metric);
    return metric;
  }

  increment(name, tags = {}) {
    return this.record(name, 1, tags);
  }

  timing(name, durationMs, tags = {}) {
    return this.record(name, durationMs, tags);
  }

  list(name = null) {
    return name ? this.metrics.filter((metric) => metric.name === name) : [...this.metrics];
  }

  summarize(name) {
    const values = this.list(name).map((metric) => metric.value);
    if (!values.length) return { name, count: 0, min: 0, max: 0, avg: 0, sum: 0 };

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      name,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum
    };
  }
}
