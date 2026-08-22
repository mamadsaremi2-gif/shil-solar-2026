export class TransactionManager {
  constructor(storage) {
    this.storage = storage;
  }

  async transaction(operations) {
    const rollback = [];

    try {
      for (const op of operations) {
        const previous = await this.storage.getItem(op.key);
        rollback.unshift({ key: op.key, previous });
        if (op.type === "set") await this.storage.setItem(op.key, op.value);
        if (op.type === "remove") await this.storage.removeItem(op.key);
      }

      return { ok: true, operations: operations.length };
    } catch (error) {
      for (const item of rollback) {
        if (item.previous === null || item.previous === undefined) await this.storage.removeItem(item.key);
        else await this.storage.setItem(item.key, item.previous);
      }
      return { ok: false, error: error.message, rolledBack: rollback.length };
    }
  }
}
