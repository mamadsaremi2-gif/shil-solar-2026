export class RollbackManager {
  constructor(storage) {
    this.storage = storage;
    this.key = "release:history";
  }

  async recordRelease(manifest) {
    const history = await this.history();
    history.unshift({
      ...manifest,
      status: "active"
    });
    await this.storage.setItem(this.key, history);
    return history[0];
  }

  async history() {
    return (await this.storage.getItem(this.key)) || [];
  }

  async markFailed(releaseId, reason) {
    const history = await this.history();
    const next = history.map((item) =>
      item.releaseId === releaseId ? { ...item, status: "failed", failureReason: reason } : item
    );
    await this.storage.setItem(this.key, next);
    return next.find((item) => item.releaseId === releaseId);
  }

  async rollbackTarget() {
    const history = await this.history();
    return history.find((item) => item.status === "active") || null;
  }
}
