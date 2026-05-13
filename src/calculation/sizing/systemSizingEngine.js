import { sizePVStrings } from "./pvStringSizer.js";
import { sizeBatteryBank } from "./batterySizer.js";
import { sizeInverter } from "./inverterSizer.js";
import { sizeCable } from "./cableSizer.js";
import { findPVModule } from "../../data/catalogs/pvModuleCatalog.js";
import { findInverter } from "../../data/catalogs/inverterCatalog.js";
import { findBattery } from "../../data/catalogs/batteryCatalog.js";

export function runSystemSizing(form, selection = {}) {
  const panel = selection.pvModuleId
    ? findPVModule(selection.pvModuleId)
    : {
        powerW: form.pv.panelPowerW,
        voc: form.pv.panelVoc,
        vmp: form.pv.panelVmp,
        tempCoeffVocPercentPerC: form.pv.tempCoeffVocPercentPerC
      };

  const inverter = selection.inverterId
    ? findInverter(selection.inverterId)
    : form.inverter;

  const battery = selection.batteryId
    ? findBattery(selection.batteryId)
    : {
        nominalVoltage: form.battery.nominalVoltage,
        capacityAh: form.battery.capacityAh,
        recommendedDoD: form.battery.depthOfDischarge,
        roundTripEfficiency: form.battery.roundTripEfficiency
      };

  const pvTargetPowerW = form.project.dailyEnergyWh / Math.max(form.environment.peakSunHours, 1);
  const pvCandidates = sizePVStrings({
    panel,
    inverter,
    minTempC: form.pv.temperatureMinC,
    targetPowerW: pvTargetPowerW
  });

  const batterySizing = sizeBatteryBank({
    dailyEnergyWh: form.project.dailyEnergyWh,
    autonomyDays: form.project.autonomyDays,
    nominalVoltage: battery.nominalVoltage,
    depthOfDischarge: battery.recommendedDoD ?? form.battery.depthOfDischarge,
    roundTripEfficiency: battery.roundTripEfficiency,
    moduleCapacityAh: battery.capacityAh || 100
  });

  const inverterSizing = sizeInverter({
    peakLoadW: form.project.peakLoadW
  });

  const cableSizing = sizeCable({
    lengthM: form.cable.lengthM,
    currentA: form.cable.currentA || form.pv.panelImp * form.pv.parallelCount,
    systemVoltage: form.pv.dcBusVoltage,
    material: form.cable.material,
    allowedVoltageDropPercent: form.cable.allowedVoltageDropPercent
  });

  return {
    pv: {
      targetPowerW: pvTargetPowerW,
      recommended: pvCandidates[0] || null,
      candidates: pvCandidates.slice(0, 10)
    },
    battery: batterySizing,
    inverter: inverterSizing,
    cable: cableSizing
  };
}
