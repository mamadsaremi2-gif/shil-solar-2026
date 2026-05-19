import { FIELD_TYPES } from "./fieldTypes.js";

export const formRegistry = {
  "project-info": {
    title: "Project Information",
    section: "project",
    fields: [
      { name: "title", label: "Project title", type: FIELD_TYPES.TEXT, required: true },
      { name: "scenario", label: "Scenario", type: FIELD_TYPES.SELECT, options: ["offgrid", "hybrid", "ongrid"], required: true },
      { name: "location", label: "Location", type: FIELD_TYPES.TEXT },
      { name: "dailyEnergyWh", label: "Daily energy Wh", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "peakLoadW", label: "Peak load W", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "autonomyDays", label: "Autonomy days", type: FIELD_TYPES.NUMBER, min: 0 }
    ]
  },
  environment: {
    title: "Environment",
    section: "environment",
    fields: [
      { name: "peakSunHours", label: "Peak sun hours", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "irradianceLossPercent", label: "Irradiance loss %", type: FIELD_TYPES.NUMBER, min: 0, max: 100 },
      { name: "soilingLossPercent", label: "Soiling loss %", type: FIELD_TYPES.NUMBER, min: 0, max: 100 },
      { name: "shadingLossPercent", label: "Shading loss %", type: FIELD_TYPES.NUMBER, min: 0, max: 100 }
    ]
  },
  "pv-array": {
    title: "PV Array",
    section: "pv",
    fields: [
      { name: "panelPowerW", label: "Panel power W", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "panelVoc", label: "Panel Voc", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "panelVmp", label: "Panel Vmp", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "panelImp", label: "Panel Imp", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "seriesCount", label: "Series count", type: FIELD_TYPES.NUMBER, min: 1, required: true },
      { name: "parallelCount", label: "Parallel count", type: FIELD_TYPES.NUMBER, min: 1, required: true }
    ]
  },
  battery: {
    title: "Battery",
    section: "battery",
    fields: [
      { name: "nominalVoltage", label: "Nominal voltage", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "capacityAh", label: "Capacity Ah", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "depthOfDischarge", label: "Depth of discharge", type: FIELD_TYPES.NUMBER, min: 0, max: 1 },
      { name: "roundTripEfficiency", label: "Round-trip efficiency", type: FIELD_TYPES.NUMBER, min: 0, max: 1 }
    ]
  },
  inverter: {
    title: "Inverter",
    section: "inverter",
    fields: [
      { name: "ratedPowerW", label: "Rated power W", type: FIELD_TYPES.NUMBER, min: 0, required: true },
      { name: "surgePowerW", label: "Surge power W", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "maxDcVoltage", label: "Max DC voltage", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "mpptMinVoltage", label: "MPPT min voltage", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "mpptMaxVoltage", label: "MPPT max voltage", type: FIELD_TYPES.NUMBER, min: 0 }
    ]
  },
  cable: {
    title: "Cable",
    section: "cable",
    fields: [
      { name: "lengthM", label: "Length m", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "currentA", label: "Current A", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "crossSectionMm2", label: "Cross-section mmÂ²", type: FIELD_TYPES.NUMBER, min: 0 },
      { name: "material", label: "Material", type: FIELD_TYPES.SELECT, options: ["copper", "aluminum"] }
    ]
  }
};

export function getFormStep(stepId) {
  return formRegistry[stepId] || null;
}

export function listFormSteps() {
  return Object.entries(formRegistry).map(([id, config]) => ({ id, ...config }));
}
