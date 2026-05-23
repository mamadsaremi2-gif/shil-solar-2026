import { runEngineeringPipeline } from "../engines/pipeline/engineeringPipeline.js";
import { buildHourlyLoadProfile } from "./load/HourlyLoadProfileEngine.js";
import { generateHourlyPVFromDailyEnergy } from "./simulation/HourlyPVGenerator.js";
import { EnergyBalanceSimulator } from "./simulation/EnergyBalanceSimulator.js";
import { calculateArrayMonthlyOutput } from "./pv/PVTemperatureDeratingEngine.js";
import { calculateStringWindow } from "./pv/PVStringEngineeringEngine.js";
import { coordinatePVProtection } from "./protection/ProtectionCoordinationEngine.js";
import { EngineeringRulePackService } from "./standards/EngineeringRulePackService.js";
import { buildEngineeringCalculationReport } from "./reporting/EngineeringCalculationReport.js";
import { monthlyClimateData } from "../climate/monthlyClimateData.js";

export class EngineeringCalculationCoreV12 {
  constructor({ rulePackId = "SHIL_BASIC_2026" } = {}) {
    this.rulePacks = new EngineeringRulePackService(rulePackId);
    this.rulePackId = rulePackId;
  }

  run(form, options = {}) {
    const result = runEngineeringPipeline(form, {
      ...options,
      advanced: options.advanced || {},
      climateCityId: options.climateCityId
    });

    const hourlyLoad = options.hourlyLoads ? buildHourlyLoadProfile(options.hourlyLoads) : null;
    const hourlyPV = hourlyLoad
      ? generateHourlyPVFromDailyEnergy(result.outputs.pv?.estimatedDailyEnergyWh || 0)
      : null;

    const batteryCapacityWh =
      form.battery.nominalVoltage *
      form.battery.capacityAh *
      Math.max(form.battery.depthOfDischarge || 0.8, 0.01);

    const balance = hourlyLoad
      ? new EnergyBalanceSimulator({ batteryCapacityWh, initialSocPercent: options.initialSocPercent ?? 60 }).simulate({
          hourlyLoadWh: hourlyLoad.hours.map((h) => h.energyWh),
          hourlyPVWh: hourlyPV
        })
      : null;

    const cityClimate = options.climateCityId ? monthlyClimateData[options.climateCityId] : null;
    const monthlyTemperaturePV = cityClimate
      ? calculateArrayMonthlyOutput({ form, monthlyClimate: cityClimate })
      : null;

    const stringWindow = calculateStringWindow({
      module: {
        voc: form.pv.panelVoc,
        vmp: form.pv.panelVmp,
        tempCoeffVocPercentPerC: form.pv.tempCoeffVocPercentPerC,
        tempCoeffVmpPercentPerC: options.tempCoeffVmpPercentPerC ?? -0.35
      },
      inverter: form.inverter,
      minTempC: form.pv.temperatureMinC,
      maxTempC: form.pv.temperatureMaxC
    });

    const protectionCoordination = coordinatePVProtection(form);
    const ruleEvaluation = {
      voltageDrop: this.rulePacks.evaluateVoltageDrop({
        dcDropPercent: result.outputs.advanced?.cables?.dc?.voltageDropPercent || 0,
        acDropPercent: result.outputs.advanced?.cables?.acSinglePhase?.voltageDropPercent || 0,
        packId: this.rulePackId
      }),
      battery: this.rulePacks.evaluateBattery({
        depthOfDischarge: form.battery.depthOfDischarge,
        roundTripEfficiency: form.battery.roundTripEfficiency,
        autonomyDays: form.project.autonomyDays,
        scenario: form.project.scenario,
        packId: this.rulePackId
      })
    };

    const enrichedResult = {
      ...result,
      outputs: {
        ...result.outputs,
        v12: {
          hourlyLoad,
          hourlyPV,
          energyBalance: balance,
          monthlyTemperaturePV,
          stringWindow,
          protectionCoordination,
          ruleEvaluation
        }
      }
    };

    return {
      result: enrichedResult,
      report: buildEngineeringCalculationReport(form, enrichedResult)
    };
  }
}
