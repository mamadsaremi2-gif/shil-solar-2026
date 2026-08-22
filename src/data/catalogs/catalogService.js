import { findPVModule, pvModuleCatalog } from "./pvModuleCatalog.js";
import { findInverter, inverterCatalog } from "./inverterCatalog.js";
import { findBattery, batteryCatalog } from "./batteryCatalog.js";
import { findClimateCity, climateCityCatalog } from "./climateCityCatalog.js";

export const catalogService = {
  pvModules: () => pvModuleCatalog,
  inverters: () => inverterCatalog,
  batteries: () => batteryCatalog,
  climateCities: () => climateCityCatalog,
  findPVModule,
  findInverter,
  findBattery,
  findClimateCity
};

export function applyCatalogSelection(form, selection = {}) {
  const pv = selection.pvModuleId ? findPVModule(selection.pvModuleId) : null;
  const inverter = selection.inverterId ? findInverter(selection.inverterId) : null;
  const battery = selection.batteryId ? findBattery(selection.batteryId) : null;
  const climate = selection.climateCityId ? findClimateCity(selection.climateCityId) : null;

  return {
    ...form,
    pv: {
      ...form.pv,
      ...(pv
        ? {
            panelPowerW: pv.powerW,
            panelVoc: pv.voc,
            panelVmp: pv.vmp,
            panelIsc: pv.isc,
            panelImp: pv.imp,
            tempCoeffVocPercentPerC: pv.tempCoeffVocPercentPerC
          }
        : {})
    },
    inverter: {
      ...form.inverter,
      ...(inverter
        ? {
            ratedPowerW: inverter.ratedPowerW,
            surgePowerW: inverter.surgePowerW,
            maxDcVoltage: inverter.maxDcVoltage,
            mpptMinVoltage: inverter.mpptMinVoltage,
            mpptMaxVoltage: inverter.mpptMaxVoltage,
            efficiency: inverter.efficiency
          }
        : {})
    },
    battery: {
      ...form.battery,
      ...(battery
        ? {
            nominalVoltage: battery.nominalVoltage,
            capacityAh: battery.capacityAh,
            depthOfDischarge: battery.recommendedDoD,
            roundTripEfficiency: battery.roundTripEfficiency
          }
        : {})
    },
    environment: {
      ...form.environment,
      ...(climate
        ? {
            peakSunHours: climate.defaultPeakSunHours
          }
        : {})
    },
    project: {
      ...form.project,
      ...(climate ? { location: `${climate.city}, ${climate.country}` } : {})
    }
  };
}
