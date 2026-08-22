import {
  STANDARD_BREAKER_RATINGS_A,
  STANDARD_FUSE_RATINGS_A,
  STANDARD_SPD_VOLTAGES_V,
  selectNextStandard
} from "./protectionStandards.js";

export function sizePVStringFuse(form) {
  const requiredA = form.pv.panelIsc * 1.25;
  return {
    requiredA,
    selectedA: selectNextStandard(requiredA, STANDARD_FUSE_RATINGS_A)
  };
}

export function sizeDCBreaker(form) {
  const requiredA = form.pv.panelImp * form.pv.parallelCount * 1.25;
  return {
    requiredA,
    selectedA: selectNextStandard(requiredA, STANDARD_BREAKER_RATINGS_A)
  };
}

export function sizeACBreaker(form) {
  const voltage = form.project.scenario === "ongrid" ? 230 : 230;
  const requiredA = form.inverter.ratedPowerW / voltage * 1.25;
  return {
    requiredA,
    selectedA: selectNextStandard(requiredA, STANDARD_BREAKER_RATINGS_A)
  };
}

export function sizeSPD(form) {
  const dcVoltage = form.pv.panelVoc * form.pv.seriesCount * 1.2;
  return {
    requiredDcVoltageV: dcVoltage,
    selectedDcSPDVoltageV: selectNextStandard(dcVoltage, STANDARD_SPD_VOLTAGES_V),
    selectedAcSPDVoltageV: 275
  };
}

export function runProtectionSizing(form) {
  return {
    pvStringFuse: sizePVStringFuse(form),
    dcBreaker: sizeDCBreaker(form),
    acBreaker: sizeACBreaker(form),
    spd: sizeSPD(form)
  };
}
