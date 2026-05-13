export const SHIL_WORKFLOW_STEPS = [
  {
    id: "project-info",
    title: "Project Information",
    section: "project",
    required: true,
    next: ["environment"]
  },
  {
    id: "environment",
    title: "Environment",
    section: "environment",
    required: true,
    next: ["project-path"]
  },
  {
    id: "project-path",
    title: "Project Path",
    section: "project",
    required: true,
    next: ["pv-array", "battery", "inverter"]
  },
  {
    id: "pv-array",
    title: "PV Array",
    section: "pv",
    required: true,
    next: ["battery", "inverter"]
  },
  {
    id: "battery",
    title: "Battery",
    section: "battery",
    requiredFor: ["offgrid", "hybrid"],
    next: ["inverter"]
  },
  {
    id: "inverter",
    title: "Inverter",
    section: "inverter",
    required: true,
    next: ["cable"]
  },
  {
    id: "cable",
    title: "Cable",
    section: "cable",
    required: true,
    next: ["run-calculation"]
  },
  {
    id: "run-calculation",
    title: "Run Calculation",
    section: "result",
    required: true,
    next: []
  }
];

export function getWorkflowStep(id) {
  return SHIL_WORKFLOW_STEPS.find((step) => step.id === id) || null;
}

export function getWorkflowStepIds() {
  return SHIL_WORKFLOW_STEPS.map((step) => step.id);
}
