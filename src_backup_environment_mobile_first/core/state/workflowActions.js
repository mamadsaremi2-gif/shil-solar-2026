export const workflowActions = {
  updateSection(section, payload) {
    return (state) => ({
      [section]: { ...(state[section] || {}), ...payload },
    });
  },

  setActiveStep(stepId, direction = "forward") {
    return (state) => ({
      ui: { ...(state.ui || {}), activeStepId: stepId, direction },
    });
  },

  setCalculationResult(result) {
    return () => ({ calculationResult: result });
  },

  markDraftSaved(savedAt = new Date().toISOString()) {
    return (state) => ({
      draft: { ...(state.draft || {}), status: "saved", savedAt },
    });
  },
};
