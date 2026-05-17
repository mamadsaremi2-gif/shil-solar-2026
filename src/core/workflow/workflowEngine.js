export function createWorkflow(steps) {
  return {
    steps,
    currentStep: steps?.[0]?.id || null,
  };
}
