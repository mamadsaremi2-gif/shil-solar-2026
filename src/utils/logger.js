export const logger = {
  info: (...args) => console.log("[SHIL][INFO]", ...args),
  warn: (...args) => console.warn("[SHIL][WARN]", ...args),
  error: (...args) => console.error("[SHIL][ERROR]", ...args)
};
