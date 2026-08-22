export const engineeringSchema = Object.freeze({
  projectInfo: {
    projectTitle: { type: "string", required: true, min: 2 },
    clientName: { type: "string", required: false },
  },
  environment: {
    city: { type: "string", required: false },
    latitude: { type: "number", required: false, min: -90, max: 90 },
    longitude: { type: "number", required: false, min: -180, max: 180 },
  },
  projectPath: {
    pathType: { type: "string", required: true },
    pvScenario: { type: "string", required: false, allowed: ["offgrid", "hybrid", "ongrid"] },
  },
  calculationMethod: {
    method: { type: "string", required: true },
  },
  calculationInputs: {},
  systemSettings: {
    dcVoltage: { type: "number", required: false, min: 12 },
  },
});
