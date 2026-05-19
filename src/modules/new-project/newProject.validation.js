export function validateNewProjectStep(stepId, form) {
  const errors = [];
  if (stepId === "project-info") {
    if (!form.projectTitle) errors.push("Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.");
    if (!form.clientName) errors.push("Ù†Ø§Ù… Ú©Ø§Ø±ÙØ±Ù…Ø§ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.");
    if (!form.city) errors.push("Ø´Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.");
  }
  return errors;
}
