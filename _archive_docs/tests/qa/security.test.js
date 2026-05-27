import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { SecureStorageAdapter } from "../../src/security/SecureStorageAdapter.js";
import { sanitizeObject } from "../../src/security/DataSanitizer.js";
import { sha256 } from "../../src/security/hash.js";
import { assert } from "../fixtures.js";

const raw = new MemoryStorageAdapter();
const secure = new SecureStorageAdapter(raw, "test-secret");

await secure.setItem("secure:test", { value: "secret-data" });
const encryptedPayload = await raw.getItem("secure:test");
const decrypted = await secure.getItem("secure:test");

assert(encryptedPayload.__secure === true, "Secure adapter should encrypt payload.");
assert(decrypted.value === "secret-data", "Secure adapter should decrypt payload.");
assert(sha256("abc").length === 64, "sha256 should return hex digest.");

const sanitized = sanitizeObject({ contact: "user@example.com", phone: "+98 912 123 4567" });
assert(sanitized.contact === "[redacted-email]", "Sanitizer should redact email.");
assert(sanitized.phone === "[redacted-phone]", "Sanitizer should redact phone.");

console.log("security.test passed");
