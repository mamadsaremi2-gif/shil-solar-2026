import { normalizeInput } from "../input/normalizeInput.js";
import { validateInput } from "../input/validateInput.js";
import { calculateLoads } from "../load/calculateLoads.js";
import { calculateBattery } from "../battery/calculateBattery.js";
import { calculatePv } from "../pv/calculatePv.js";
import { calculateInverter } from "../inverter/calculateInverter.js";
import { calculateController } from "../controller/calculateController.js";
import { calculateCabling } from "../cable/calculateCabling.js";
import { calculateProtection } from "../protection/calculateProtection.js";
import { calculateInstallation } from "../installation/calculateInstallation.js";
import { generateAdvisorMessages } from "../advisor/generateAdvisorMessages.js";
import { simulateSystem } from "../simulation/simulateSystem.js";
import { calculateIndustrialMetrics } from "../industrial/calculateIndustrialMetrics.js";
import { evaluateDesignValidation } from "../validation/evaluateDesignValidation.js";
import { calculateDecisionEngine } from "../decision/calculateDecisionEngine.js";

export function runEngineeringDesign(rawForm) {
  const input = normalizeInput(rawForm);
  const errors = validateInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, input };
  }

  const loads = calculateLoads(input);
  const inverter = calculateInverter(input, loads);
  const battery = calculateBattery(input, loads);
  const pv = calculatePv(input, loads, battery, inverter);
  const controller = calculateController(input, pv);
  const cabling = calculateCabling(input, loads, inverter, pv, controller);
  const installation = calculateInstallation(input, pv, inverter, cabling);
  const protection = calculateProtection(input, cabling, controller, inverter, pv, installation);
  const simulation = simulateSystem(input, loads, battery, pv);
  const industrial = calculateIndustrialMetrics(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, installation);
  const advisor = generateAdvisorMessages(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation);
  const validation = evaluateDesignValidation(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation);
  const decision = calculateDecisionEngine(input, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation, validation);
  for (const item of decision.decisions || []) {
    if (item.severity !== "pass") advisor.push({ severity: item.severity, title: item.title, message: `${item.message} ${item.recommendation || ""}`.trim(), relatedStep: item.category || "review" });
  }
  const hasError = advisor.some((item) => item.severity === "error") || validation.summary.status === "error" || decision.overallStatus === "not_executable";
  const hasWarning = advisor.some((item) => item.severity === "warning") || validation.summary.status === "warning" || decision.overallStatus === "executable_with_warnings";

  return {
    ok: true,
    input,
    errors: {},
    result: {
      summary: {
        projectTitle: input.projectTitle,
        systemType: input.systemType,
        calculationMode: input.calculationMode,
        hybridMode: input.hybridMode,
        targetOffsetPercent: input.targetOffsetPercent,
        connectedPowerW: loads.connectedPowerW,
        demandPowerW: loads.demandPowerW,
        demandApparentVA: loads.demandApparentVA,
        connectedApparentVA: loads.connectedApparentVA,
        averageCoincidenceFactor: loads.averageCoincidenceFactor,
        averagePowerFactor: loads.averagePowerFactor,
        loadPowerW: loads.loadPowerW,
        totalDailyEnergyWh: loads.totalDailyEnergyWh,
        batteryAh: battery.requiredBatteryAh,
        batteryCount: battery.totalCount,
        batteryBackupHours: battery.realBackupHours,
        batteryBackupHoursAtPeak: battery.realBackupHoursAtPeak ?? battery.realBackupHours,
        batteryAutonomyDays: battery.realAutonomyDays ?? 0,
        inverterPowerW: inverter.continuousPowerW,
        inverterPowerVA: inverter.continuousPowerVA,
        inverterSurgePowerW: inverter.surgePowerW,
        inverterSurgePowerVA: inverter.surgePowerVA,
        panelCount: pv?.panelCount ?? 0,
        pvInstalledPowerW: pv?.installedPvPowerW ?? 0,
        pvDailyProductionWh: pv?.estimatedDailyProductionWh ?? 0,
        controllerVocStatus: pv ? pv.vocOk : null,
        mpptArchitecture: pv?.mpptDesign?.architecture ?? null,
        mpptCompatibilityStatus: pv?.mpptDesign?.status ?? null,
        designStatus: hasError ? "error" : hasWarning ? "warning" : "success",
        controllerCurrentA: controller?.selectedCurrentA ?? 0,
        controllerCount: controller?.controllerCount ?? 0,
        controllerPerUnitA: controller?.perControllerA ?? 0,
        dcCableSizeMm2: cabling.dcCableSizeMm2,
        batteryCableSizeMm2: cabling.batteryCableSizeMm2,
        acCableSizeMm2: cabling.acCableSizeMm2,
        dcFuseA: protection.dcFuseA,
        batteryFuseA: protection.batteryFuseA,
        acFuseA: protection.acFuseA,
        gridImportWh: simulation?.summary?.gridImportWh ?? 0,
        gridExportWh: simulation?.summary?.gridExportWh ?? 0,
        serviceabilityScore: industrial.serviceabilityScore,
        validationScore: validation.summary.score,
        validationGrade: validation.summary.grade,
        validationLabel: validation.summary.label,
        decisionStatus: decision.overallStatus,
        economicStatus: decision.economicStatus,
        netCoverageRatio: decision.netCoverageRatio,
        dcAcRatio: decision.dcAcRatio,
        validationErrors: validation.summary.counts.error,
        validationWarnings: validation.summary.counts.warning,
        requiredBackupHours: industrial.requiredBackupHours,
        realBackupHours: industrial.realBackupHours,
        backupCoverageRatio: industrial.backupCoverageRatio,
        pvCoverageRatio: industrial.pvCoverageRatio,
        recommendedDcVoltage: industrial.recommendedDcVoltage,
        dcCurrentAtDemandA: industrial.dcCurrentAtDemandA,
        dcCurrentAtSurgeA: industrial.dcCurrentAtSurgeA,
        installationAreaM2: installation?.area?.requiredAreaM2 ?? 0,
        installationAreaStatus: installation?.area?.status ?? null,
        installationNetDailyProductionWh: installation?.losses?.netDailyProductionWh ?? pv?.estimatedDailyProductionWh ?? 0,
        installationServiceabilityScore: installation?.serviceability?.score ?? 0,
        pvOrientationLossPercent: installation?.orientation?.orientationLossPercent ?? 0,
        pvTiltLossPercent: installation?.tilt?.tiltLossPercent ?? 0,
        pvTotalInstallationLossPercent: installation?.losses?.totalInstallationLossPercent ?? 0,
      },
      loads,
      battery,
      pv,
      inverter,
      controller,
      cabling,
      protection,
      installation,
      simulation,
      industrial,
      advisor,
      validation,
      decision,
    },
  };
}
