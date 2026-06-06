export class TraceService {
  constructor() {
    this.traces = new Map();
  }

  start(name, meta = {}) {
    const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const trace = {
      id,
      name,
      meta,
      spans: [],
      startedAt: performance.now(),
      startedAtIso: new Date().toISOString(),
      endedAt: null,
      durationMs: null
    };
    this.traces.set(id, trace);
    return id;
  }

  span(traceId, name, data = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    const span = {
      name,
      data,
      atMs: performance.now() - trace.startedAt,
      atIso: new Date().toISOString()
    };
    trace.spans.push(span);
    return span;
  }

  end(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.endedAt = new Date().toISOString();
    trace.durationMs = performance.now() - trace.startedAt;
    return trace;
  }

  list() {
    return [...this.traces.values()];
  }
}
