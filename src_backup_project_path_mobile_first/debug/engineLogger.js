export function createEngineLogger(scope = 'engine') {
  const entries = [];
  return {
    info: (message, data = {}) => entries.push({ level: 'info', scope, message, data, at: new Date().toISOString() }),
    warn: (message, data = {}) => entries.push({ level: 'warn', scope, message, data, at: new Date().toISOString() }),
    error: (message, data = {}) => entries.push({ level: 'error', scope, message, data, at: new Date().toISOString() }),
    flush: () => [...entries],
  };
}
