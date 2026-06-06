import { buildSolarSystemDesign } from "../solar/solarDesignEngine.js";
import { runBatteryEngine } from "../battery/batteryEngine.js";

function normalizeDomain(form = {}, options = {}) {
  const raw = options.domain || form.designDomain || form.domain || form.project?.scenario || form.project?.domain || form.source?.domain || "solar";
  const value = String(raw).toLowerCase();
  if (value.includes("emergency") || value.includes("backup")) return "emergency";
  if (value.includes("utility")) return "utility";
  return "solar";
}

function normalizeBanks(form = {}, options = {}) {
  const equipment = options.banks || form.banks || form.equipment || form.equipmentBanks || {};
  return {
    panels: equipment.panels || equipment.solarPanels || equipment.pvPanels || [],
    inverters: equipment.inverters || equipment.solarInverters || equipment.hybridInverters || [],
    batteries: equipment.batteries || equipment.batteryBank || [],
    cables: equipment.cables || [],
    protections: equipment.protections || equipment.protection || [],
  };
}

function normalizeWarnings(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === "string") return { message: item };
    return item;
  });
}

function normalizeExplanations(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => item?.message || item?.fa || String(item));
}

export function runEngineeringPipeline(form = {}, options = {}) {
  const domain = normalizeDomain(form, options);
  const project = form.project || form.projectInfo || {};
  const banks = normalizeBanks(form, options);
  const handoff = form.handoff || form.systemSetupHandoff || form;
  const settings = form.settings || form.systemSettings || form.systemSettingsDraft || {};

  const gatewayResult = {
    ok: true,
    valid: true,
    errors: [],
    warnings: [],
    explanations: ["خروجی از موتور یکپارچه src/engineering تولید شد و مسیرهای Legacy برای طراحی خورشیدی کنار گذاشته شدند."],
    values: {},
  };

  let solarDesign = null;
  if (domain === "solar" || domain === "utility") {
    try {
      solarDesign = buildSolarSystemDesign({ handoff, settings, banks });
    } catch (error) {
      solarDesign = {
        valid: false,
        warnings: [],
        errors: [{ code: "SOLAR_DESIGN_ERROR", message: error?.message || String(error) }],
      };
    }
  }

  let batteryDesign = null;
  if (domain === "emergency" || settings.systemType === "offgrid" || settings.systemType === "hybrid") {
    try {
      batteryDesign = runBatteryEngine(
        {
          project: {
            ...project,
            scenario: domain === "emergency" ? "emergency" : settings.systemType,
            dailyEnergyWh: form.dailyEnergyWh || form.load?.dailyEnergyWh || form.load?.dailyEnergyKWh * 1000 || solarDesign?.load?.finalEnergyKWh * 1000 || 0,
            autonomyDays: settings.autonomyDays || project.autonomyDays || 1,
            autonomyHours: settings.autonomyHours || project.autonomyHours || 0,
            reserveFactor: 1,
          },
          battery: form.battery || solarDesign?.battery?.item || {},
        },
        options
      );
    } catch (error) {
      batteryDesign = {
        valid: false,
        errors: [{ code: "BATTERY_ENGINE_ERROR", message: error?.message || String(error) }],
        warnings: [],
      };
    }
  }

  const warnings = [
    ...normalizeWarnings(gatewayResult?.warnings),
    ...normalizeWarnings(solarDesign?.warnings),
    ...normalizeWarnings(batteryDesign?.warnings),
  ];
  const errors = [
    ...(Array.isArray(gatewayResult?.errors) ? gatewayResult.errors : []),
    ...(Array.isArray(solarDesign?.errors) ? solarDesign.errors : []),
    ...(Array.isArray(batteryDesign?.errors) ? batteryDesign.errors : []),
  ];
  const explanations = [
    ...normalizeExplanations(gatewayResult?.explanations),
    ...normalizeExplanations(batteryDesign?.explanations),
  ];

  const valid = gatewayResult?.ok !== false && gatewayResult?.valid !== false && solarDesign?.valid !== false && batteryDesign?.valid !== false && errors.length === 0;

  return {
    status: valid ? "success" : "needs-review",
    mode: "UNIFIED_ENGINEERING_PIPELINE",
    version: 1,
    valid,
    canContinue: valid || options.stopOnValidationError === false,
    domain,
    scenario: settings.systemType || project.scenario || domain,
    input: form,
    outputs: {
      gateway: gatewayResult,
      solarDesign,
      batteryDesign,
      values: solarDesign ? { solarDesign } : gatewayResult?.values || {},
    },
    values: solarDesign ? { solarDesign } : gatewayResult?.values || {},
    solarDesign: solarDesign || gatewayResult?.solarDesign || null,
    batteryDesign,
    warnings,
    errors,
    explanations,
    selectedBanks: solarDesign?.selectedBanks || {},
    operational: gatewayResult?.operational || null,
  };
}

export default runEngineeringPipeline;
