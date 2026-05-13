import { getFormStep } from "./formRegistry.js";

export function readStepValues(form, stepId) {
  const config = getFormStep(stepId);
  if (!config) throw new Error(`Unknown form step: ${stepId}`);
  return form[config.section] || {};
}

export function writeStepValues(form, stepId, values) {
  const config = getFormStep(stepId);
  if (!config) throw new Error(`Unknown form step: ${stepId}`);

  return {
    ...form,
    [config.section]: {
      ...form[config.section],
      ...values
    }
  };
}

export function validateFieldLevel(values, fields) {
  const messages = [];

  for (const field of fields) {
    const value = values[field.name];

    if (field.required && (value === undefined || value === null || value === "")) {
      messages.push({ field: field.name, severity: "error", message: `${field.label} is required.` });
    }

    if (field.type === "number" && value !== undefined && value !== null && value !== "") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) messages.push({ field: field.name, severity: "error", message: `${field.label} must be numeric.` });
      if (field.min !== undefined && numeric < field.min) messages.push({ field: field.name, severity: "error", message: `${field.label} is below minimum.` });
      if (field.max !== undefined && numeric > field.max) messages.push({ field: field.name, severity: "error", message: `${field.label} is above maximum.` });
    }

    if (field.type === "select" && value && field.options && !field.options.includes(value)) {
      messages.push({ field: field.name, severity: "error", message: `${field.label} has invalid option.` });
    }
  }

  return {
    valid: messages.filter((m) => m.severity === "error").length === 0,
    messages
  };
}
