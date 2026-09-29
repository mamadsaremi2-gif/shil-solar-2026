import { runEngineeringDesign } from "../runEngineeringDesign.js";
import { buildHourlyLoadProfile } from "./load/HourlyLoadProfileEngine.js";
import { generateHourlyPVFromDailyEnergy } from "./simulation/HourlyPVGenerator.js";
import { EnergyBalanceSimulator } from "./simulation/EnergyBalanceSimulator.js";
import { calculateArrayMonthlyOutput } from "./pv/PVTemperatureDeratingEngine.js";
import { calculateStringWindow } from "./pv/PVStringEngineeringEngine.js";
import { monthlyClimateData } from "../climate/monthlyClimateData.js";
import { buildEngineeringCalculationReport } from "./reporting/EngineeringCalculationReport.js";

export class EngineeringCalculationCoreV12 {
  constructor({ rulePackId = "SHIL_UNIFIED_FINAL_GATEWAY" } = {}) {
    this.rulePackId = rulePackId;
    this.engine = "SHIL_Unified_Final_Calculation_Gateway";
  }

  run(form = {}, options = {}) {
    const result = runEngineeringDesign(form, {
      ...options,
      source: options.source || "engineering-core-v12-facade",
      rulePackId: this.rulePackId,
    });

    if (result?.outputs?.pv && form?.pv && form?.inverter) {
      const hourlyLoad = buildHourlyLoadProfile(options.hourlyLoads || []);
      const dailyPvEnergyWh = result.outputs.pv.estimatedDailyEnergyWh || 0;
      const hourlyPVWh = generateHourlyPVFromDailyEnergy(dailyPvEnergyWh);
      const hourlyLoadWh = hourlyLoad.hours.map((item) => item.energyWh);
      const batteryCapacityWh = Math.max(
        0,
        (form.battery?.nominalVoltage || 0) *
        (form.battery?.capacityAh || 0) *
        (form.battery?.depthOfDischarge || 1)
      );
      const energyBalance = new EnergyBalanceSimulator({
        batteryCapacityWh,
        initialSocPercent: 80,
        minSocPercent: 10,
      }).simulate({ hourlyLoadWh, hourlyPVWh });

      const climate = monthlyClimateData[options.climateCityId || "ir_tehran"] || monthlyClimateData.ir_tehran;
      const monthlyTemperaturePV = climate ? calculateArrayMonthlyOutput({ form, monthlyClimate: climate }) : [];
      const stringWindow = calculateStringWindow({
        module: {
          voc: form.pv.panelVoc,
          vmp: form.pv.panelVmp,
          tempCoeffVocPercentPerC: form.pv.tempCoeffVocPercentPerC,
          tempCoeffVmpPercentPerC: form.pv.tempCoeffVmpPercentPerC ?? -0.35,
        },
        inverter: {
          maxDcVoltage: form.inverter.maxDcVoltage,
          mpptMinVoltage: form.inverter.mpptMinVoltage,
          mpptMaxVoltage: form.inverter.mpptMaxVoltage,
        },
        minTempC: form.pv.temperatureMinC,
        maxTempC: form.pv.temperatureMaxC,
      });

      result.outputs.v12 = { hourlyLoad, energyBalance, monthlyTemperaturePV, stringWindow };
      if (!Array.isArray(result.trace)) result.trace = [];
      if (!result.trace.includes("engine:v12")) result.trace.push("engine:v12");
      return { result, report: buildEngineeringCalculationReport(form, result) };
    }

    return { result, report: buildUnifiedReport(form, result) };
  }
}

function buildUnifiedReport(form, result) {
  const important = result?.summary?.important_results || {};
  return {
    meta: {
      title: form?.project?.title || "",
      scenario: form?.project?.scenario || result?.scenario || "",
      generatedAt: new Date().toISOString(),
      calculationCoreVersion: "12.0.0",
    },
    engine: result.engine || "SHIL_Unified_Final_Calculation_Gateway",
    status: result.status,
    valid: result.valid,
    project: form?.project || {},
    importantResults: important,
    warnings: result.warnings || [],
    explanations: result.explanations || [],
    generatedAt: new Date().toISOString(),
  };
}
