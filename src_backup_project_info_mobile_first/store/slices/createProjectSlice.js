export const createInitialProjectState = () => ({
  id: null,
  title: '',
  customer: '',
  scenario: null,
  connectionType: null,
  currentStep: 'project-info',
  completedSteps: [],
  form: {
    projectInfo: {},
    environment: {},
    projectPath: {},
    calculationInputs: {},
    execution: {},
    systemSettings: {},
    summary: {},
  },
  result: null,
});

export const createProjectSlice = (set, get) => ({
  project: createInitialProjectState(),

  setProjectMeta: (payload = {}) =>
    set((state) => ({ project: { ...state.project, ...payload } }), false, 'project/setMeta'),

  setProjectStep: (step) =>
    set((state) => ({ project: { ...state.project, currentStep: step } }), false, 'project/setStep'),

  completeProjectStep: (step = get().project.currentStep) =>
    set((state) => {
      const completedSteps = state.project.completedSteps.includes(step)
        ? state.project.completedSteps
        : [...state.project.completedSteps, step];
      return { project: { ...state.project, completedSteps } };
    }, false, 'project/completeStep'),

  updateProjectSection: (section, payload = {}) =>
    set((state) => ({
      project: {
        ...state.project,
        form: {
          ...state.project.form,
          [section]: {
            ...(state.project.form?.[section] || {}),
            ...payload,
          },
        },
      },
    }), false, 'project/updateSection'),

  setProjectResult: (result) =>
    set((state) => ({ project: { ...state.project, result } }), false, 'project/setResult'),

  resetProject: () => set({ project: createInitialProjectState() }, false, 'project/reset'),
});
