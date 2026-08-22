export const REQUIRED_FORM_SECTIONS = Object.freeze([
  "projectInfo",
  "environment",
  "projectPath",
  "calculationMethod",
  "calculationInputs",
  "systemSettings",
]);

export function createEngineeringForm(sections = {}) {
  return {
    projectInfo: sections.projectInfo || {},
    environment: sections.environment || {},
    projectPath: sections.projectPath || {},
    calculationMethod: sections.calculationMethod || {},
    calculationInputs: sections.calculationInputs || {},
    systemSettings: sections.systemSettings || {},
    meta: {
      schemaVersion: 2,
      createdAt: new Date().toISOString(),
    },
  };
}
