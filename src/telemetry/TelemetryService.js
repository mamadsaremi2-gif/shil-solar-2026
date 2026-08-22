export class TelemetryService {
  constructor(storage, key = "telemetry:events") {
    this.storage = storage;
    this.key = key;
  }

  async list() {
    return (await this.storage.getItem(this.key)) || [];
  }

  async track(eventName, payload = {}, meta = {}) {
    const events = await this.list();
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      eventName,
      payload,
      meta,
      createdAt: new Date().toISOString()
    };

    events.push(event);
    await this.storage.setItem(this.key, events);
    return event;
  }

  async summarize() {
    const events = await this.list();
    const byName = events.reduce((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      byName,
      firstAt: events[0]?.createdAt || null,
      lastAt: events[events.length - 1]?.createdAt || null
    };
  }

  async clear() {
    await this.storage.setItem(this.key, []);
    return true;
  }
}
