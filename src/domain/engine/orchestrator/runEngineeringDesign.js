import { normalizeInput } from "../input/normalizeInput.js";
import { validateInput } from "../input/validateInput.js";
import { calculateLoads } from "../load/calculateLoads.js";
import { calculateBattery } from "../battery/calculateBattery.js";
import { calculatePv } from "../pv/calculatePv.js";
import { calculateInverter } from "../inverter/calculateInverter.js";
import { calculateController } from "../controller/calculateController.js";
import { calculateCabling } from "../cable/calculateCabling.js";
import { calculateProtection } from "../protection/calculateProtection.js";
import { generateAdvisorMessages } from "../advisor/generateAdvisorMessages.js";
import { simulateSystem } from "../simulation/simulateSystem.js";

export function runEngineeringDesign(rawForm) {
  const input = normalizeInput(rawForm);
  const errors = validateInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, input };
  }

  const loads = calculateLoads(input);
  const battery = calculateBattery(input, loads);
  const pv = calculatePv(input, loads, battery);
  const inverter = calculateInverter(input, loads);
  const controller = calculateController(input, pv);
  const cabling = calculateCabling(input, loads, inverter, pv, controller);
  const protection = calculateProtection(input, cabling, controller, inverter);
  const simulation = simulateSystem(input, loads, battery, pv);
  const advisor = generateAdvisorMessages(input, loads, battery, pv, inverter, controller, cabling, protection, simulation);
  const hasError = advisor.some((item) => item.severity === "error");
  const hasWarning = advisor.some((item) => item.severity === "warning");

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
        loadPowerW: loads.loadPowerW,
        totalDailyEnergyWh: loads.totalDailyEnergyWh,
        batteryAh: battery.requiredBatteryAh,
        batteryCount: battery.totalCount,
        batteryBackupHours: battery.realBackupHours,
        inverterPowerW: inverter.continuousPowerW,
        inverterSurgePowerW: inverter.surgePowerW,
        panelCount: pv?.panelCount ?? 0,
        pvInstalledPowerW: pv?.installedPvPowerW ?? 0,
        pvDailyProductionWh: pv?.estimatedDailyProductionWh ?? 0,
        controllerVocStatus: pv ? pv.stringVocCold < input.controllerMaxVoc : null,
        designStatus: hasError ? "error" : hasWarning ? "warning" : "success",
        controllerCurrentA: controller?.selectedCurrentA ?? 0,
        dcCableSizeMm2: cabling.dcCableSizeMm2,
        batteryCableSizeMm2: cabling.batteryCableSizeMm2,
        acCableSizeMm2: cabling.acCableSizeMm2,
        dcFuseA: protection.dcFuseA,
        batteryFuseA: protection.batteryFuseA,
        acFuseA: protection.acFuseA,
        gridImportWh: simulation?.summary?.gridImportWh ?? 0,
        gridExportWh: simulation?.summary?.gridExportWh ?? 0,
      },
      loads,
      battery,
      pv,
      inverter,
      controller,
      cabling,
      protection,
      simulation,
      advisor,
    },
  };
}
