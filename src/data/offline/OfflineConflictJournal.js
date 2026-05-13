export class OfflineConflictJournal {
  constructor(storage, key = "offline:conflicts") {
    this.storage = storage;
    this.key = key;
  }

  async list() {
    return (await this.storage.getItem(this.key)) || [];
  }

  async record(conflict) {
    const conflicts = await this.list();
    const entry = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      ...conflict,
      status: conflict.status || "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };
    conflicts.push(entry);
    await this.storage.setItem(this.key, conflicts);
    return entry;
  }

  async resolve(id, resolution) {
    const conflicts = await this.list();
    const next = conflicts.map((item) =>
      item.id === id ? { ...item, status: "resolved", resolution, resolvedAt: new Date().toISOString() } : item
    );
    await this.storage.setItem(this.key, next);
    return next.find((item) => item.id === id) || null;
  }
}
