export function error(field, message, code = "VALIDATION_ERROR") {
  return { severity: "error", field, message, code };
}

export function warning(field, message, code = "VALIDATION_WARNING") {
  return { severity: "warning", field, message, code };
}
