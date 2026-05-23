import crypto from "node:crypto";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function stableHashObject(value) {
  return sha256(JSON.stringify(value, Object.keys(value || {}).sort()));
}
