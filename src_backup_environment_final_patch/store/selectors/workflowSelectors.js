export const selectCurrentStep = (state) => state.currentStep;
export const selectForm = (state) => state.form;
export const selectSection = (section) => (state) => state.form[section];
export const selectValidation = (state) => state.validation;
export const selectEngineResult = (state) => state.engineResult;
export const selectIsDirty = (state) => state.dirty;
