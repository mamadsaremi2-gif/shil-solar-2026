export class MemoryStorageAdapter {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed));
  }

  async getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  async setItem(key, value) {
    this.data.set(key, value);
    return value;
  }

  async removeItem(key) {
    this.data.delete(key);
    return true;
  }

  async keys(prefix = "") {
    return [...this.data.keys()].filter((key) => key.startsWith(prefix));
  }

  async clear() {
    this.data.clear();
    return true;
  }
}
