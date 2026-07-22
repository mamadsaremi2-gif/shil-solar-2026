import { createEngineeringForm } from "../contracts/engineeringFormContract.js";

export function createWorkflowStore(initialState = {}) {
  let state = {
    currentStep: initialState.currentStep || "project-info",
    completedSteps: initialState.completedSteps || [],
    form: createEngineeringForm(initialState.form || {}),
    validation: {
      valid: false,
      errors: [],
      warnings: []
    },
    engineResult: null,
    dirty: false
  };

  const listeners = new Set();

  function emit() {
    for (const listener of listeners) listener(getState());
  }

  function getState() {
    return structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  }

  function setState(updater) {
    const next = typeof updater === "function" ? updater(state) : updater;
    state = { ...state, ...next };
    emit();
    return getState();
  }

  function updateSection(section, payload) {
    if (!state.form[section]) {
      throw new Error(`Unknown workflow form section: ${section}`);
    }

    return setState({
      form: {
        ...state.form,
        [section]: {
          ...state.form[section],
          ...payload
        }
      },
      dirty: true
    });
  }

  function setStep(step) {
    return setState({ currentStep: step });
  }

  function completeStep(step = state.currentStep) {
    const completedSteps = state.completedSteps.includes(step)
      ? state.completedSteps
      : [...state.completedSteps, step];

    return setState({ completedSteps });
  }

  function setValidation(validation) {
    return setState({ validation });
  }

  function setEngineResult(engineResult) {
    return setState({ engineResult, dirty: false });
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset(nextInitialState = {}) {
    state = {
      currentStep: nextInitialState.currentStep || "project-info",
      completedSteps: [],
      form: createEngineeringForm(nextInitialState.form || {}),
      validation: { valid: false, errors: [], warnings: [] },
      engineResult: null,
      dirty: false
    };
    emit();
    return getState();
  }

  return {
    getState,
    setState,
    updateSection,
    setStep,
    completeStep,
    setValidation,
    setEngineResult,
    subscribe,
    reset
  };
}

export const workflowStore = createWorkflowStore();
