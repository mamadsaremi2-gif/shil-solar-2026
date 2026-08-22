import fs from "node:fs/promises";
import path from "node:path";

export class JsonFileStorageAdapter {
  constructor(filePath = "./shil.localdb.json") {
    this.filePath = filePath;
  }

  async ensureFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify({}), "utf-8");
    }
  }

  async readAll() {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, "utf-8");
    return raw ? JSON.parse(raw) : {};
  }

  async writeAll(data) {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }

  async getItem(key) {
    const data = await this.readAll();
    return data[key] ?? null;
  }

  async setItem(key, value) {
    const data = await this.readAll();
    data[key] = value;
    await this.writeAll(data);
    return value;
  }

  async removeItem(key) {
    const data = await this.readAll();
    delete data[key];
    await this.writeAll(data);
    return true;
  }

  async keys(prefix = "") {
    const data = await this.readAll();
    return Object.keys(data).filter((key) => key.startsWith(prefix));
  }

  async clear() {
    await this.writeAll({});
    return true;
  }
}
