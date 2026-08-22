export class AutoSaveController {
  constructor({ repository, intervalMs = 30000 } = {}) {
    this.repository = repository;
    this.intervalMs = intervalMs;
    this.pending = new Map();
  }

  queue(projectId, patch) {
    this.pending.set(projectId, {
      projectId,
      patch,
      queuedAt: new Date().toISOString()
    });
    return this.pending.get(projectId);
  }

  async flush() {
    const saved = [];

    for (const item of this.pending.values()) {
      if (!this.repository) continue;
      saved.push(await this.repository.updateProject(item.projectId, item.patch));
    }

    this.pending.clear();
    return saved;
  }

  pendingCount() {
    return this.pending.size;
  }
}
