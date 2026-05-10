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
import { buildEngineeringAudit } from "../audit/buildEngineeringAudit.js";
import { getEngineeringEquipmentBank } from "../catalog/shilEquipmentBank.js";
import { calculateShadowAnalysis } from "../site/calculateShadowAnalysis.js";
import { calculateClimateIntelligence, buildClimateProductionForecast } from "../climate/calculateClimateIntelligence.js";
import { calculateFinancials } from "../financial/calculateFinancials.js";
import { buildProfessionalReportSnapshot } from "../report/buildProfessionalReportSnapshot.js";
import { calculateMaintenancePlan } from "../maintenance/calculateMaintenancePlan.js";
import { calculateRiskRegister } from "../risk/calculateRiskRegister.js";
import { calculateLossModel } from "../loss/calculateLossModel.js";

export function runEngineeringDesign(rawForm) {
  const input = normalizeInput(rawForm);
  const errors = validateInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, input };
  }

  const shadowAnalysis = calculateShadowAnalysis(input);
  const climate = calculateClimateIntelligence(input, shadowAnalysis);
  const climateAdjustedInput = (input.systemType !== "backup" && input.climateCorrectionEnabled) ? {
    ...input,
    sunHours: climate.correctedPsh || input.sunHours,
    shadingFactor: shadowAnalysis.effectiveShadingFactor ?? input.shadingFactor,
    climateDerateFactor: climate.climateDerateFactor ?? 1,
    averageTemperature: Number.isFinite(Number(climate.averageTemperature)) ? climate.averageTemperature : input.averageTemperature,
    minTemperature: Number.isFinite(Number(climate.minTemperature)) ? climate.minTemperature : input.minTemperature,
    maxTemperature: Number.isFinite(Number(climate.maxTemperature)) ? climate.maxTemperature : input.maxTemperature,
    realAverageTemperature: Number.isFinite(Number(climate.averageTemperature)) ? climate.averageTemperature : input.realAverageTemperature,
    realMinTemperature: Number.isFinite(Number(climate.minTemperature)) ? climate.minTemperature : input.realMinTemperature,
    realMaxTemperature: Number.isFinite(Number(climate.maxTemperature)) ? climate.maxTemperature : input.realMaxTemperature,
    dustFactor: climate.dustFactor || input.dustFactor,
  } : input;
  const loads = calculateLoads(climateAdjustedInput);
  const inverter = calculateInverter(climateAdjustedInput, loads);
  const battery = calculateBattery(climateAdjustedInput, loads);
  const pv = calculatePv(climateAdjustedInput, loads, battery, inverter);
  const climateWithForecast = { ...climate, productionForecast: buildClimateProductionForecast(climateAdjustedInput, climate, pv) };
  const controller = calculateController(climateAdjustedInput, pv);
  const cabling = calculateCabling(climateAdjustedInput, loads, inverter, pv, controller);
  const installation = calculateInstallation(climateAdjustedInput, pv, inverter, cabling);
  const protection = calculateProtection(climateAdjustedInput, cabling, controller, inverter, pv, installation);
  const lossModel = calculateLossModel(climateAdjustedInput, pv, cabling, installation, shadowAnalysis, climateWithForecast);
  const simulation = simulateSystem(climateAdjustedInput, loads, battery, pv);
  const industrial = calculateIndustrialMetrics(climateAdjustedInput, loads, battery, pv, inverter, controller, cabling, protection, simulation, installation);
  const financials = calculateFinancials(climateAdjustedInput, loads, pv, battery, inverter, simulation);
  const draftForOps = { loads, battery, pv, inverter, controller, cabling, protection, installation, simulation, industrial, financials, shadowAnalysis, climate: climateWithForecast, lossModel };
  const maintenancePlan = calculateMaintenancePlan(climateAdjustedInput, draftForOps);
  const advisor = generateAdvisorMessages(climateAdjustedInput, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation);
  const validation = evaluateDesignValidation(climateAdjustedInput, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation);
  const decision = calculateDecisionEngine(climateAdjustedInput, loads, battery, pv, inverter, controller, cabling, protection, simulation, industrial, installation, validation);
  for (const item of decision.decisions || []) {
    if (item.severity !== "pass") advisor.push({ severity: item.severity, title: item.title, message: `${item.message} ${item.recommendation || ""}`.trim(), relatedStep: item.category || "review" });
  }
  const hasError = advisor.some((item) => item.severity === "error") || validation.summary.status === "error" || decision.overallStatus === "not_executable";
  const hasWarning = advisor.some((item) => item.severity === "warning") || validation.summary.status === "warning" || decision.overallStatus === "executable_with_warnings";
  const equipmentBank = getEngineeringEquipmentBank();
  const draftResult = { loads, battery, pv, inverter, controller, cabling, protection, installation, simulation, industrial, financials, maintenancePlan, advisor, validation, decision, shadowAnalysis, climate: climateWithForecast, lossModel };
  const riskRegister = calculateRiskRegister(climateAdjustedInput, draftResult);
  draftResult.riskRegister = riskRegister;
  const engineeringAudit = buildEngineeringAudit({ input: climateAdjustedInput, result: draftResult });
  const reportSnapshot = buildProfessionalReportSnapshot({ input: climateAdjustedInput, result: { ...draftResult, engineeringAudit, summary: {} }, financials });

  return {
    ok: true,
    input,
    errors: {},
    result: {
      summary: {
        projectTitle: input.projectTitle,
        systemType: input.systemType,
        calculationMode: input.calculationMode,
        userComplexityMode: input.userComplexityMode,
        engineeringMode: input.engineeringMode,
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
        inverterArchitecture: inverter.architecture,
        inverterParallelCount: inverter.parallelCount,
        inverterUnitPowerW: inverter.unitPowerW,
        inverterParallelPolicy: inverter.parallelPolicy,
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
        climateCorrectedPsh: climateWithForecast?.correctedPsh ?? 0,
        climateSource: climateWithForecast?.source ?? null,
        climateOnlineStatus: climateWithForecast?.onlineStatus ?? null,
        climateFetchedAt: climateWithForecast?.fetchedAt ?? null,
        realIrradianceKwhM2Day: climateWithForecast?.realIrradianceKwhM2Day ?? 0,
        realAverageTemperature: climateWithForecast?.averageTemperature ?? 0,
        realMinTemperature: climateWithForecast?.minTemperature ?? 0,
        realMaxTemperature: climateWithForecast?.maxTemperature ?? 0,
        climateDerateFactor: climateWithForecast?.climateDerateFactor ?? 1,
        shadowLossPercent: shadowAnalysis?.totalLossPercent ?? 0,
        shadowStatus: shadowAnalysis?.status ?? "not_checked",
        shadowCriticalHours: shadowAnalysis?.criticalHours ?? input.shadowCriticalHours ?? null,
        shadowWorstObjectTitle: shadowAnalysis?.worstObject?.title ?? null,
        vocColdCorrectedV: pv?.temperatureVoltageCorrection?.stringVocColdV ?? pv?.stringVocCold ?? 0,
        vmpHotCorrectedV: pv?.temperatureVoltageCorrection?.stringVmpHotV ?? pv?.stringVmpHot ?? 0,
        iscHotCorrectedA: pv?.temperatureVoltageCorrection?.moduleIscHotA ?? 0,
        temperatureVoltageStatus: pv?.temperatureVoltageCorrection?.status ?? null,
        annualProductionKwh: financials?.annualProductionKwh ?? 0,
        annualOffsetKwh: financials?.annualOffsetKwh ?? 0,
        estimatedProjectCost: financials?.totalEstimatedCost ?? 0,
        estimatedPaybackYears: financials?.simplePaybackYears ?? null,
        financialCompleteness: financials?.costCompleteness ?? "not_priced",
        maintenanceStatus: maintenancePlan?.status ?? "normal",
        maintenanceHighPriorityCount: maintenancePlan?.highPriorityCount ?? 0,
        nextServiceLabel: maintenancePlan?.nextServiceLabel ?? null,
        riskStatus: riskRegister?.status ?? "clear",
        riskCriticalCount: riskRegister?.criticalCount ?? 0,
        riskHighCount: riskRegister?.highCount ?? 0,
        professionalReportVersion: reportSnapshot?.reportVersion ?? "Professional Report v4",
        reportProjectCode: reportSnapshot?.projectCode ?? null,
        shadowStatus: shadowAnalysis?.status ?? "not_checked",
        worstSolarMonth: climateWithForecast?.worstMonth?.month ?? null,
        climateForecastDailyKwh: climateWithForecast?.productionForecast?.dailyProductionKwh ?? 0,
        climateForecastAnnualKwh: climateWithForecast?.productionForecast?.annualProductionKwh ?? 0,
        pvOrientationLossPercent: installation?.orientation?.orientationLossPercent ?? 0,
        pvTiltLossPercent: installation?.tilt?.tiltLossPercent ?? 0,
        pvTotalInstallationLossPercent: installation?.losses?.totalInstallationLossPercent ?? 0,
        pvStringSeries: pv?.panelSeriesCount ?? 0,
        pvStringParallel: pv?.panelParallelCount ?? 0,
        pvStringVocColdV: pv?.stringVocCold ?? 0,
        pvStringVmpHotV: pv?.stringVmpHot ?? 0,
        pvStringCurrentA: pv?.stringCurrentA ?? 0,
        pvOverVoltageStatus: pv?.vocOk === false ? "error" : "pass",
        pvOverCurrentStatus: pv?.mpptCurrentOk === false || pv?.mpptIscOk === false ? "error" : "pass",
        dcVoltageDropPercent: cabling?.dcVoltageDropPercent ?? 0,
        batteryVoltageDropPercent: cabling?.batteryVoltageDropPercent ?? 0,
        acVoltageDropPercent: cabling?.acVoltageDropPercent ?? 0,
        cableStatus: [cabling?.dc?.status, cabling?.battery?.status, cabling?.ac?.status].includes("warning") ? "warning" : "pass",
        lossModelTotalPercent: lossModel?.totalLossPercent ?? 0,
        lossModelNetPerformanceRatio: lossModel?.netPerformanceRatio ?? 1,
        lossModelNetDailyProductionWh: lossModel?.netDailyProductionWh ?? pv?.estimatedDailyProductionWh ?? 0,
        lossModelAnnualNetProductionKwh: lossModel?.annualNetProductionKwh ?? 0,
        lossTemperaturePercent: lossModel?.temperatureLossPercent ?? 0,
        lossCablePercent: lossModel?.cableLossPercent ?? 0,
        lossDustPercent: lossModel?.dustLossPercent ?? 0,
        lossAnglePercent: lossModel?.angleLossPercent ?? 0,
        lossMismatchPercent: lossModel?.mismatchLossPercent ?? 0,
        lossMpptPercent: lossModel?.mpptLossPercent ?? 0,
      },
      loads,
      battery,
      pv,
      inverter,
      controller,
      cabling,
      protection,
      installation,
      shadowAnalysis,
      climate: climateWithForecast,
      financials,
      lossModel,
      maintenancePlan,
      riskRegister,
      reportSnapshot,
      simulation,
      industrial,
      advisor,
      validation,
      decision,
      engineeringAudit,
      equipmentBank,
      engineMeta: {
        engineName: "Unified SHIL Engineering Engine",
        phaseVersion: "Phase Engineering v9 - Camera/String/Cable/Loss Layer",
        engineMode: input.engineeringMode,
        offlineFirst: true,
        cloudEnhancement: "optional",
        simpleAndProfessionalUseSameEngine: true,
      },
    },
  };
}
