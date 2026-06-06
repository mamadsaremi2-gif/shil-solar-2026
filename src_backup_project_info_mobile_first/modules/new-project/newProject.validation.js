export function validateNewProjectStep(stepId, form) {
  const errors = [];
  if (stepId === "project-info") {
    if (!form.projectTitle) errors.push("نام پروژه الزامی است.");
    if (!form.clientName) errors.push("نام کارفرما الزامی است.");
    if (!form.city) errors.push("شهر پروژه الزامی است.");
  }
  return errors;
}
