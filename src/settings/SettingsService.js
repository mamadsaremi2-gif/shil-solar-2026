import { DEFAULT_SETTINGS } from "./defaultSettings.js";

export class SettingsService {
  constructor(storage, key = "settings:app") {
    this.storage = storage;
    this.key = key;
  }

  async get() {
    return {
      ...DEFAULT_SETTINGS,
      ...((await this.storage.getItem(this.key)) || {})
    };
  }

  async update(patch) {
    const current = await this.get();
    const next = {
      ...current,
      ...patch,
      calculation: {
        ...current.calculation,
        ...(patch.calculation || {})
      },
      sync: {
        ...current.sync,
        ...(patch.sync || {})
      }
    };

    await this.storage.setItem(this.key, next);
    return next;
  }

  async reset() {
    await this.storage.setItem(this.key, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}
