import { sizePVStrings } from "./pvStringSizer.js";
import { sizeBatteryBank } from "./batterySizer.js";
import { sizeInverter } from "./inverterSizer.js";
import { sizeCable } from "./cableSizer.js";

export function runSystemSizing(form = {}, selection = {}) {
  const targetPowerW = selection.targetPowerW || Math.max(
    form.project?.peakLoadW || 0,
    (form.project?.dailyEnergyWh || 0) / Math.max(form.environment?.peakSunHours || 1, 1)
  );
  const pvCandidates = sizePVStrings({
    panel: {
      powerW: form.pv?.panelPowerW || 0,
      voc: form.pv?.panelVoc || 0,
      vmp: form.pv?.panelVmp || 0,
      tempCoeffVocPercentPerC: form.pv?.tempCoeffVocPercentPerC || -0.28,
    },
    inverter: {
      maxDcVoltage: form.inverter?.maxDcVoltage || 0,
      mpptMinVoltage: form.inverter?.mpptMinVoltage || 0,
      mpptMaxVoltage: form.inverter?.mpptMaxVoltage || 0,
    },
    minTempC: form.pv?.temperatureMinC || 0,
    targetPowerW,
  });
  const recommended = pvCandidates[0] || null;
  const battery = sizeBatteryBank({
    dailyEnergyWh: form.project?.dailyEnergyWh || 0,
    autonomyDays: form.project?.autonomyDays || 1,
    nominalVoltage: form.battery?.nominalVoltage || 48,
    depthOfDischarge: form.battery?.depthOfDischarge || 0.8,
    roundTripEfficiency: form.battery?.roundTripEfficiency || 0.9,
    moduleCapacityAh: selection.moduleCapacityAh || 100,
  });
  const inverter = sizeInverter({ peakLoadW: form.project?.peakLoadW || 0, surgeLoadW: form.inverter?.surgePowerW || 0 });
  const cable = sizeCable({
    lengthM: form.cable?.lengthM || 0,
    currentA: form.cable?.currentA || 0,
    systemVoltage: form.pv?.dcBusVoltage || 48,
    crossSectionMm2: form.cable?.crossSectionMm2 || 0,
  });
  return {
    status: recommended ? "success" : "needs-review",
    valid: Boolean(recommended),
    canContinue: Boolean(recommended),
    form,
    selection,
    pv: { recommended, candidates: pvCandidates },
    battery,
    inverter,
    cable,
    warnings: recommended ? [] : [{ code: "PV_STRING_NOT_FOUND", message: "No compatible PV string candidate found." }],
    explanations: [],
  };
}
