export const logger = {
  info(message, context = {}) {
    console.info(`[SHIL] ${message}`, context);
  },
  warn(message, context = {}) {
    console.warn(`[SHIL] ${message}`, context);
  },
  error(message, context = {}) {
    console.error(`[SHIL] ${message}`, context);
  },
};
