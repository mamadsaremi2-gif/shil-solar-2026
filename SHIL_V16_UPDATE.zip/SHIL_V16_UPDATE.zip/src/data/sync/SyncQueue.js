import { STORAGE_KEYS } from "../storage/storageKeys.js";

function createOperationId() {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class SyncQueue {
  constructor(storage) {
    this.storage = storage;
  }

  async readQueue() {
    return (await this.storage.getItem(STORAGE_KEYS.SYNC_QUEUE)) || [];
  }

  async writeQueue(queue) {
    await this.storage.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
    return queue;
  }

  async enqueue(operation) {
    const queue = await this.readQueue();
    const item = {
      id: operation.id || createOperationId(),
      type: operation.type,
      payload: operation.payload || {},
      status: "pending",
      attempts: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    queue.push(item);
    await this.writeQueue(queue);
    return item;
  }

  async markDone(id) {
    const queue = await this.readQueue();
    const next = queue.map((item) =>
      item.id === id ? { ...item, status: "done", updatedAt: new Date().toISOString() } : item
    );
    await this.writeQueue(next);
    return next.find((item) => item.id === id);
  }

  async markFailed(id, error) {
    const queue = await this.readQueue();
    const next = queue.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "failed",
            attempts: item.attempts + 1,
            lastError: String(error?.message || error),
            updatedAt: new Date().toISOString()
          }
        : item
    );
    await this.writeQueue(next);
    return next.find((item) => item.id === id);
  }

  async pending() {
    const queue = await this.readQueue();
    return queue.filter((item) => item.status === "pending" || item.status === "failed");
  }

  async compact() {
    const queue = await this.readQueue();
    const next = queue.filter((item) => item.status !== "done");
    await this.writeQueue(next);
    return next;
  }
}
