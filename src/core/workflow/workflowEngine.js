export const workflowSteps = {
  solar: [
    "project-info",
    "environment",
    "equipment",
    "system",
    "summary",
    "run"
  ],

  emergency: [
    "project-info",
    "equipment",
    "system",
    "summary",
    "run"
  ]
};

export function canAccessStep(completedSteps, targetStep, type) {
  const steps = workflowSteps[type] || [];
  const targetIndex = steps.indexOf(targetStep);

  if (targetIndex <= 0) return true;

  const previousStep = steps[targetIndex - 1];

  return completedSteps.includes(previousStep);
}
