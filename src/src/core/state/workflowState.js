export const initialWorkflowState = Object.freeze({
  projectInfo: {},
  environment: {},
  projectPath: {},
  calculationMethod: {},
  calculationInputs: {},
  systemSettings: {},
  summary: {},
  calculationResult: null,
  draft: { status: "new", savedAt: null },
  ui: { activeStepId: "project-info", direction: "forward" },
  meta: { version: 2, createdAt: null, updatedAt: null, lastAction: null },
});

export function createInitialWorkflowState() {
  const now = new Date().toISOString();
  return {
    ...structuredClone(initialWorkflowState),
    meta: { ...initialWorkflowState.meta, createdAt: now, updatedAt: now },
  };
}
