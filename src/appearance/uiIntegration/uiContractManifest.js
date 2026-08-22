export const uiContractManifest = {
  version: "9.0.0",
  layoutPolicy: {
    visualDesignLocked: false,
    mobileFirstRequired: true,
    globalHorizontalScrollAllowed: false,
    fixedHeaderFooterExpected: true
  },
  dataContracts: {
    workflowStore: "src/store/workflowStore.js",
    formRegistry: "src/forms/formRegistry.js",
    workflowDefinition: "src/workflow/workflowDefinition.js",
    appKernel: "src/app/ShilAppKernel.js"
  },
  integrationPoints: [
    {
      id: "mobile-step-renderer",
      purpose: "Render each workflow step from form registry without duplicating validation logic."
    },
    {
      id: "calculation-runner",
      purpose: "Run engineering design through AppKernel or ShilProjectService."
    },
    {
      id: "report-viewer",
      purpose: "Render object/markdown/csv reports from reporting exporters."
    },
    {
      id: "project-dashboard",
      purpose: "Read projects from ProjectRepository via ShilProjectService."
    }
  ]
};
