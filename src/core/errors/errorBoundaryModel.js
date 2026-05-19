import { AppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

export function normalizeError(error, fallbackCode = ERROR_CODES.ENGINE_FAILED) {
  if (error instanceof AppError) return error;
  return new AppError(error?.message || "Ø®Ø·Ø§ÛŒ Ù¾ÛŒØ´â€ŒØ¨ÛŒÙ†ÛŒâ€ŒÙ†Ø´Ø¯Ù‡ Ø±Ø® Ø¯Ø§Ø¯.", {
    code: fallbackCode,
    cause: error,
    recoverable: true,
  });
}

export function createRecoveryState(error) {
  const normalized = normalizeError(error);
  return {
    hasError: true,
    error: normalized.toJSON(),
    canRetry: normalized.recoverable,
  };
}
