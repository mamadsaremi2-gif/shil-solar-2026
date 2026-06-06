export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code || "APP_ERROR";
    this.level = options.level || "error";
    this.cause = options.cause;
    this.context = options.context || {};
    this.recoverable = options.recoverable ?? true;
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      level: this.level,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      createdAt: this.createdAt,
    };
  }
}
