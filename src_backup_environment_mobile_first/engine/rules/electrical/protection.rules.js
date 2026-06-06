import { round } from '../../utils/number.js';
import { protectionRegistry } from '../../../data/registry/protection/protection.registry.js';

const registry = Array.isArray(protectionRegistry) ? protectionRegistry : [];

function findBy(predicate) {
  return registry.find((item) => item.enabled !== false && predicate(item)) || null;
}

function rangeIncludes(range = [], value = 0) {
  if (!Array.isArray(range) || range.length < 2) return false;
  return Number(value) >= Number(range[0]) && Number(value) <= Number(range[1]);
}

function pickDcBreaker(currentA = 0, voltageV = 1000) {
  const type = currentA <= 125 ? 'DC_MCB' : 'DC_MCCB';
  return findBy((item) =>
    item.deviceType === type &&
    Number(item.ratedVoltageV || 0) >= Number(voltageV || 0) &&
    (rangeIncludes(item.ratedCurrentRangeA, currentA) || rangeIncludes(item.currentRangeA, currentA))
  ) || findBy((item) => item.deviceType === type) || null;
}

function pickPvFuse(currentA = 0, voltageV = 1000) {
  return findBy((item) =>
    item.deviceType === 'PV_FUSE' &&
    Number(item.ratedVoltageV || 0) >= Number(voltageV || 0) &&
    rangeIncludes(item.currentRangeA, currentA)
  ) || findBy((item) => item.deviceType === 'PV_FUSE') || null;
}

function pickSpd(lightningRisk = 'normal', voltageV = 1000) {
  const preferredType = lightningRisk === 'high' ? 'T1+T2' : 'T2';
  return findBy((item) =>
    item.deviceType === 'SPD' &&
    item.side === 'PV_DC' &&
    item.spdType === preferredType &&
    Array.isArray(item.ucRangeVdc) &&
    Number(item.ucRangeVdc[1]) >= Number(voltageV || 0)
  ) || findBy((item) => item.deviceType === 'SPD' && item.side === 'PV_DC' && item.spdType === 'T2') || null;
}

function pickIsolator(currentA = 0, voltageV = 1000) {
  return findBy((item) =>
    item.deviceType === 'DC_ISOLATOR' &&
    Number(item.ratedVoltageV || 0) >= Number(voltageV || 0) &&
    Number(item.ratedCurrentA || 0) >= Number(currentA || 0)
  ) || findBy((item) => item.deviceType === 'DC_ISOLATOR') || null;
}

function pickAcBreaker(currentA = 0) {
  return findBy((item) =>
    item.deviceType === 'AC_BREAKER' && rangeIncludes(item.ratedCurrentRangeA, currentA)
  ) || findBy((item) => item.deviceType === 'AC_BREAKER') || null;
}

function pickBatteryFuse(currentA = 0) {
  return findBy((item) =>
    item.deviceType === 'BATTERY_FUSE' && rangeIncludes(item.currentRangeA, currentA)
  ) || findBy((item) => item.deviceType === 'BATTERY_FUSE') || null;
}

function breakerType(currentA, side) {
  if (side === 'DC') return currentA <= 125 ? 'DC MCB' : 'DC MCCB';
  return currentA <= 63 ? 'MCB + RCD' : 'MCCB + RCD';
}

function toRecommendation(item, fallbackLabel) {
  if (!item) return { label: fallbackLabel, id: null, engineeringClass: null };
  return {
    id: item.id,
    label: item.title || item.label || fallbackLabel,
    engineeringClass: item.engineeringClass || null,
    deviceType: item.deviceType,
    ratedVoltageV: item.ratedVoltageV || item.ucRangeVdc || item.ratedVoltageVdc || null,
    ratedCurrent: item.ratedCurrentA || item.ratedCurrentRangeA || item.currentRangeA || null,
    poles: item.poles || null,
    ipRating: item.ipRating || null,
    standard: item.standard || null,
  };
}

export const protectionRule = Object.freeze({
  id: 'protection',
  title: 'انتخاب حفاظت DC/AC/Battery بر اساس بانک SHIL',
  version: '2.0.0',
  run(input = {}, result = {}) {
    const peakLoadW = result.values?.designLoadW || result.values?.peakLoadW || 0;
    const inverter = result.equipment?.inverter || {};
    const battery = result.equipment?.battery || {};
    const acVoltage = inverter.outputVoltage || 230;
    const batteryVoltage = inverter.batteryVoltage || battery.nominalVoltage || 48;
    const pvVoltage = result.values?.stringVocCold || result.values?.stringVocCorrectedV || result.values?.stringVocV || inverter.maxPvVocV || inverter.maxPvVoc || 1000;
    const pvCurrentA = result.values?.pvCurrentA || result.values?.stringCurrentA || 0;
    const lightningRisk = input.environment?.lightningRisk || input.site?.lightningRisk || 'normal';

    const acCurrentA = round(peakLoadW / Math.max(acVoltage, 1), 2);
    const batteryCurrentA = round(peakLoadW / Math.max(batteryVoltage, 1), 2);
    const pvDesignCurrentA = round(pvCurrentA * 1.25, 2);
    const batteryDesignCurrentA = round(batteryCurrentA * 1.25, 2);
    const acDesignCurrentA = round(acCurrentA * 1.25, 2);

    const selected = {
      pvBreaker: pickDcBreaker(pvDesignCurrentA, pvVoltage),
      pvFuse: pickPvFuse(pvDesignCurrentA, pvVoltage),
      pvSpd: pickSpd(lightningRisk, Math.min(Math.max(pvVoltage, 600), 1500)),
      pvIsolator: pickIsolator(pvDesignCurrentA, pvVoltage),
      batteryFuse: pickBatteryFuse(batteryDesignCurrentA),
      acBreaker: pickAcBreaker(acDesignCurrentA),
    };

    const protection = {
      pvDc: {
        designVoltageV: round(pvVoltage, 2),
        currentA: pvDesignCurrentA,
        breaker: toRecommendation(selected.pvBreaker, breakerType(pvDesignCurrentA, 'DC')).label,
        fuse: toRecommendation(selected.pvFuse, 'PV gPV Fuse').label,
        isolator: toRecommendation(selected.pvIsolator, 'PV DC Isolator').label,
        breakerType: breakerType(pvDesignCurrentA, 'DC'),
        breakerSelection: toRecommendation(selected.pvBreaker, 'DC Breaker / DC MCCB'),
        fuseSelection: toRecommendation(selected.pvFuse, 'PV gPV Fuse'),
        isolatorSelection: toRecommendation(selected.pvIsolator, 'PV DC Isolator'),
        poles: selected.pvBreaker?.poles || '2P or 4P',
        spd: toRecommendation(selected.pvSpd, lightningRisk === 'high' ? 'Type I+II DC' : 'Type II DC').label,
        spdSelection: toRecommendation(selected.pvSpd, 'PV SPD'),
      },
      batteryDc: {
        designVoltageV: batteryVoltage,
        currentA: batteryDesignCurrentA,
        fuse: toRecommendation(selected.batteryFuse, batteryVoltage >= 48 ? 'NH / DC Fuse' : 'MEGA or ANL Fuse').label,
        fuseSelection: toRecommendation(selected.batteryFuse, 'Battery DC Fuse'),
        isolator: 'Battery DC Isolator',
      },
      ac: {
        designVoltageV: acVoltage,
        currentA: acDesignCurrentA,
        breaker: toRecommendation(selected.acBreaker, breakerType(acDesignCurrentA, 'AC')).label,
        breakerType: breakerType(acDesignCurrentA, 'AC'),
        breakerSelection: toRecommendation(selected.acBreaker, 'AC Breaker'),
        poles: acVoltage >= 380 ? '3P+N' : '1P+N',
        spd: 'Type II AC',
      },
    };

    return {
      values: { protection, protectionBankConnected: true },
      equipment: { protection },
      explanations: [{
        rule: 'protection',
        message: 'حفاظت‌های DC، باتری و AC با ضریب جریان ۱.۲۵ و بر اساس بانک عمومی SHIL انتخاب شدند؛ مدل تجاری در محاسبات دخالت ندارد.',
      }],
    };
  },
});
