import { AppError } from "../../core/errors/AppError.js";
import { ERROR_CODES } from "../../core/errors/errorCodes.js";

export function createMemoryStorageAdapter(initial = {}) {
  const memory = new Map(Object.entries(initial));
  return createStorageAdapter({
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => memory.set(key, value),
    removeItem: async (key) => memory.delete(key),
  });
}

export function createBrowserStorageAdapter(storage = globalThis?.localStorage) {
  return createStorageAdapter({
    getItem: async (key) => storage.getItem(key),
    setItem: async (key, value) => storage.setItem(key, value),
    removeItem: async (key) => storage.removeItem(key),
  });
}

function createStorageAdapter(driver) {
  return {
    async getJSON(key, fallback = null) {
      try {
        const raw = await driver.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        throw new AppError("Storage read failed.", { code: ERROR_CODES.STORAGE_FAILED, cause: error, context: { key } });
      }
    },
    async setJSON(key, value) {
      try {
        await driver.setItem(key, JSON.stringify(value));
        return value;
      } catch (error) {
        throw new AppError("Storage write failed.", { code: ERROR_CODES.STORAGE_FAILED, cause: error, context: { key } });
      }
    },
    async remove(key) {
      try {
        await driver.removeItem(key);
      } catch (error) {
        throw new AppError("Storage remove failed.", { code: ERROR_CODES.STORAGE_FAILED, cause: error, context: { key } });
      }
    },
  };
}
