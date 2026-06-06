import DOMPurify from "dompurify";

export function sanitizeHTML(input = "") {
  return DOMPurify.sanitize(String(input));
}

export function sanitizePlainText(input = "") {
  return String(input).replace(/[<>]/g, "").trim();
}

export function secureNumber(input, fallback = 0) {
  const value = Number(input);
  return Number.isFinite(value) ? value : fallback;
}
