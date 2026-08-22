import { error, warning } from "../validationMessage.js";

function temperatureCorrectedVoc(panelVoc, seriesCount, tempCoeff, minTempC) {
  const delta = 25 - minTempC;
  const correction = 1 + Math.abs(tempCoeff) / 100 * delta;
  return panelVoc * seriesCount * correction;
}

export function validatePVRules(form) {
  const messages = [];
  const { pv, inverter, environment } = form;

  if (pv.panelPowerW <= 0) messages.push(error("pv.panelPowerW", "PV panel power must be greater than zero."));
  if (pv.panelVoc <= 0) messages.push(error("pv.panelVoc", "PV panel Voc must be greater than zero."));
  if (pv.panelVmp <= 0) messages.push(error("pv.panelVmp", "PV panel Vmp must be greater than zero."));
  if (pv.seriesCount < 1) messages.push(error("pv.seriesCount", "PV series count must be at least 1."));
  if (pv.parallelCount < 1) messages.push(error("pv.parallelCount", "PV parallel count must be at least 1."));

  const arrayVocCold = temperatureCorrectedVoc(
    pv.panelVoc,
    pv.seriesCount,
    pv.tempCoeffVocPercentPerC,
    pv.temperatureMinC
  );

  const arrayVmp = pv.panelVmp * pv.seriesCount;

  if (arrayVocCold > inverter.maxDcVoltage) {
    messages.push(error("pv.seriesCount", "Cold corrected PV string voltage exceeds inverter maximum DC voltage.", "PV_MAX_DC_VOLTAGE"));
  }

  if (arrayVmp < inverter.mpptMinVoltage) {
    messages.push(error("pv.seriesCount", "PV string Vmp is below inverter MPPT minimum voltage.", "PV_MPPT_LOW"));
  }

  if (arrayVmp > inverter.mpptMaxVoltage) {
    messages.push(error("pv.seriesCount", "PV string Vmp exceeds inverter MPPT maximum voltage.", "PV_MPPT_HIGH"));
  }

  if (environment.peakSunHours <= 0) {
    messages.push(error("environment.peakSunHours", "Peak sun hours must be greater than zero."));
  }

  if (pv.parallelCount > 8) {
    messages.push(warning("pv.parallelCount", "High parallel string count may require combiner/fuse review."));
  }

  return messages;
}

export function getPVValidationMetrics(form) {
  const { pv } = form;
  return {
    arrayPowerW: pv.panelPowerW * pv.seriesCount * pv.parallelCount,
    arrayVmp: pv.panelVmp * pv.seriesCount,
    arrayVoc: pv.panelVoc * pv.seriesCount,
    arrayImp: pv.panelImp * pv.parallelCount,
    panelCount: pv.seriesCount * pv.parallelCount
  };
}
