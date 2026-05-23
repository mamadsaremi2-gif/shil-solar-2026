export class EventLogService {
  constructor({ maxEntries = 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.events = [];
  }

  log(level, message, context = {}) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      level,
      message,
      context,
      createdAt: new Date().toISOString()
    };

    this.events.unshift(entry);
    this.events = this.events.slice(0, this.maxEntries);
    return entry;
  }

  info(message, context) {
    return this.log("info", message, context);
  }

  warn(message, context) {
    return this.log("warn", message, context);
  }

  error(message, context) {
    return this.log("error", message, context);
  }

  query({ level, since } = {}) {
    return this.events.filter((event) => {
      if (level && event.level !== level) return false;
      if (since && event.createdAt < since) return false;
      return true;
    });
  }

  countByLevel() {
    return this.events.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1;
      return acc;
    }, {});
  }
}
