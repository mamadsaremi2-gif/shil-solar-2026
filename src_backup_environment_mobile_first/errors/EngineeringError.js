export class EngineeringError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = "EngineeringError";
    this.code = meta.code || "ENGINEERING_ERROR";
    this.severity = meta.severity || "error";
    this.field = meta.field || null;
    this.details = meta.details || {};
  }
}
