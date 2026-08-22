import crypto from "node:crypto";

function createKey(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

export class SecureStorageAdapter {
  constructor(innerStorage, secret = "shil-local-development-secret") {
    this.innerStorage = innerStorage;
    this.key = createKey(secret);
  }

  encrypt(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const plaintext = JSON.stringify(value);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      __secure: true,
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      data: encrypted.toString("base64")
    };
  }

  decrypt(payload) {
    if (!payload?.__secure) return payload;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(payload.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  }

  async getItem(key) {
    const payload = await this.innerStorage.getItem(key);
    return this.decrypt(payload);
  }

  async setItem(key, value) {
    return this.innerStorage.setItem(key, this.encrypt(value));
  }

  async removeItem(key) {
    return this.innerStorage.removeItem(key);
  }

  async keys(prefix = "") {
    return this.innerStorage.keys(prefix);
  }

  async clear() {
    return this.innerStorage.clear();
  }
}
