import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";

const engines = new Map();

export const EngineRegistry = {
  register(name, runner) {
    if (!name || typeof runner !== "function") throw new AppError("Engine registration is invalid.", { code: ERROR_CODES.ENGINE_FAILED });
    engines.set(name, runner);
    return this;
  },

  get(name) {
    if (!engines.has(name)) {
      throw new AppError(`Engine not registered: ${name}`, { code: ERROR_CODES.ENGINE_NOT_REGISTERED, context: { name } });
    }
    return engines.get(name);
  },

  has(name) {
    return engines.has(name);
  },

  list() {
    return Array.from(engines.keys());
  },

  clear() {
    engines.clear();
  },
};
