import { engineeringSchema } from "./engineeringSchema.js";

export function validateBySchema(form, schema = engineeringSchema) {
  const checks = [];

  Object.entries(schema).forEach(([sectionName, fields]) => {
    const section = form?.[sectionName] || {};
    Object.entries(fields).forEach(([fieldName, rules]) => {
      const value = section[fieldName];
      const path = `${sectionName}.${fieldName}`;

      if (rules.required && isEmpty(value)) {
        checks.push(createCheck(path, "required", "error", "این فیلد الزامی است."));
        return;
      }
      if (isEmpty(value)) return;
      if (rules.type && typeof value !== rules.type) checks.push(createCheck(path, "type", "error", `نوع مقدار باید ${rules.type} باشد.`));
      if (typeof value === "string" && rules.min && value.length < rules.min) checks.push(createCheck(path, "minLength", "error", `حداقل ${rules.min} کاراکتر لازم است.`));
      if (typeof value === "number" && typeof rules.min === "number" && value < rules.min) checks.push(createCheck(path, "min", "error", `مقدار کمتر از حد مجاز است.`));
      if (typeof value === "number" && typeof rules.max === "number" && value > rules.max) checks.push(createCheck(path, "max", "error", `مقدار بیشتر از حد مجاز است.`));
      if (rules.allowed && !rules.allowed.includes(value)) checks.push(createCheck(path, "allowed", "error", "مقدار انتخاب‌شده معتبر نیست."));
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
