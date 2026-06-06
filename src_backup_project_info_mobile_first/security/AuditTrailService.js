
export class AuditTrailService {
  constructor() {
    this.events = [];
  }
  record(type, payload = {}) {
    const evt = {
      id: `audit_${Date.now()}`,
      type,
      payload,
      at: new Date().toISOString()
    };
    this.events.push(evt);
    return evt;
  }
  list() {
    return [...this.events];
  }
}
