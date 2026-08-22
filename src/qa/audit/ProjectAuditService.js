export class ProjectAuditService {
  constructor(storage) {
    this.storage = storage;
  }

  async record({ actor = "system", action, entityType, entityId, before = null, after = null, meta = {} }) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      actor,
      action,
      entityType,
      entityId,
      before,
      after,
      meta,
      createdAt: new Date().toISOString()
    };

    await this.storage.setItem(`audit:${entry.id}`, entry);
    return entry;
  }

  async list({ entityId } = {}) {
    const keys = await this.storage.keys("audit:");
    const entries = [];

    for (const key of keys) {
      const item = await this.storage.getItem(key);
      if (item && (!entityId || item.entityId === entityId)) entries.push(item);
    }

    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
