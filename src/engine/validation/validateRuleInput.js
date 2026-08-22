export function validateRuleInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return {
    ...input,
    project: input.project || {},
    environment: input.environment || {},
    equipment: input.equipment || {},
    userInputs: input.userInputs || {},
  };
}
