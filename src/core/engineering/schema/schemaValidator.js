import { engineeringSchema } from "./engineeringSchema.js";

export function validateBySchema(form, schema = engineeringSchema) {
  const checks = [];

  Object.entries(schema).forEach(([sectionName, fields]) => {
    const section = form?.[sectionName] || {};
    Object.entries(fields).forEach(([fieldName, rules]) => {
      const value = section[fieldName];
      const path = `${sectionName}.${fieldName}`;

      if (rules.required && isEmpty(value)) {
        checks.push(createCheck(path, "required", "error", "Ø§ÛŒÙ† ÙÛŒÙ„Ø¯ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª."));
        return;
      }
      if (isEmpty(value)) return;
      if (rules.type && typeof value !== rules.type) checks.push(createCheck(path, "type", "error", `Ù†ÙˆØ¹ Ù…Ù‚Ø¯Ø§Ø± Ø¨Ø§ÛŒØ¯ ${rules.type} Ø¨Ø§Ø´Ø¯.`));
      if (typeof value === "string" && rules.min && value.length < rules.min) checks.push(createCheck(path, "minLength", "error", `Ø­Ø¯Ø§Ù‚Ù„ ${rules.min} Ú©Ø§Ø±Ø§Ú©ØªØ± Ù„Ø§Ø²Ù… Ø§Ø³Øª.`));
      if (typeof value === "number" && typeof rules.min === "number" && value < rules.min) checks.push(createCheck(path, "min", "error", `Ù…Ù‚Ø¯Ø§Ø± Ú©Ù…ØªØ± Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª.`));
      if (typeof value === "number" && typeof rules.max === "number" && value > rules.max) checks.push(createCheck(path, "max", "error", `Ù…Ù‚Ø¯Ø§Ø± Ø¨ÛŒØ´ØªØ± Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª.`));
      if (rules.allowed && !rules.allowed.includes(value)) checks.push(createCheck(path, "allowed", "error", "Ù…Ù‚Ø¯Ø§Ø± Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª."));
    });
  });

  return {
    ok: checks.every((check) => check.level !== "error"),
    checks,
  };
}

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function createCheck(path, rule, level, message) {
  return { path, rule, level, message };
}
