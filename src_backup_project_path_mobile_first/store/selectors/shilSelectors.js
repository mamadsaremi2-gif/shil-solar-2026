export const selectProject = (state) => state.project;
export const selectProjectForm = (state) => state.project.form;
export const selectProjectStep = (state) => state.project.currentStep;
export const selectCompletedSteps = (state) => state.project.completedSteps;
export const selectSystemSettings = (state) => state.project.form.systemSettings;

export const selectEquipmentState = (state) => state.equipment;
export const selectSelectedEquipment = (state) => state.equipment.selected;
export const selectEquipmentFilters = (state) => state.equipment.filters;

export const selectUi = (state) => state.ui;
export const selectAuth = (state) => state.auth;
