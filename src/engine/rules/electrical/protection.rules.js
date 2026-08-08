import { round } from '../../utils/number.js';
import { protectionRegistry } from '../../../data/registry/protection/protection.registry.js';

const registry = Array.isArray(protectionRegistry) ? protectionRegistry : [];
const STANDARD_AMPS = [2,4,6,10,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600];
const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const nextStandardAmp = (value) => STANDARD_AMPS.find((a) => a >= Math.max(0, num(value))) || Math.ceil(Math.max(0, num(value)) / 100) * 100;
const rangeIncludes = (range = [], value = 0) => Array.isArray(range) && range.length >= 2 && num(value) >= num(range[0]) && num(value) <= num(range[1]);
const enabled = (item) => item?.enabled !== false;
const maxRatedVoltage = (item) => { const v = item?.ratedVoltageV ?? item?.ratedVoltageVdc ?? item?.ucRangeVdc; return Array.isArray(v) ? Math.max(...v.map((x) => num(x, 0))) : num(v, 99999); };
const normalizeText = (v = '') => String(v || '').toLowerCase();

function findExact(predicate) { return registry.find((item) => enabled(item) && predicate(item)) || null; }
function ratingRange(item) { return item?.ratedCurrentRangeA || item?.currentRangeA || (item?.ratedCurrentA ? [item.ratedCurrentA, item.ratedCurrentA] : []); }
function breakingCapacityAtVoltage(item, voltageV = 0) {
  const raw = item?.breakingCapacityKA;
  if (Number.isFinite(Number(raw))) return Number(raw);
  if (!raw || typeof raw !== 'object') return null;
  const entries = Object.entries(raw).map(([key, value]) => ({ voltage: num(String(key).replace(/\D/g, ''), 0), value: num(value, 0) })).filter((x) => x.value > 0);
  if (!entries.length) return null;
  const atOrAbove = entries.filter((x) => x.voltage >= voltageV).sort((a, b) => a.voltage - b.voltage)[0];
  return (atOrAbove || entries.sort((a, b) => b.voltage - a.voltage)[0])?.value || null;
}
function selectDevice(deviceTypes, requiredA, voltageV = 0, side = '', requiredBreakingKA = null) {
  const types = Array.isArray(deviceTypes) ? deviceTypes : [deviceTypes];
  const candidates = registry.filter((item) => enabled(item) && types.includes(item.deviceType) && (!side || !item.side || String(item.side).includes(side)) && (!voltageV || maxRatedVoltage(item) >= voltageV) && rangeIncludes(ratingRange(item), requiredA));
  if (!candidates.length) return null;
  if (!requiredBreakingKA) return candidates[0];
  return candidates.find((item) => num(breakingCapacityAtVoltage(item, voltageV), 0) >= requiredBreakingKA) || null;
}
function rec(item, fallback, ratingA, quantity = 1, extra = {}) {
  const brand = item?.brand || 'SHIL';
  return {
    id: item?.id || null,
    brand,
    label: item?.title || `SHIL ${fallback}`,
    model: item?.model || null,
    engineeringClass: item?.engineeringClass || null,
    deviceType: item?.deviceType || null,
    ratedVoltageV: item?.ratedVoltageV || item?.ratedVoltageVdc || item?.ucRangeVdc || null,
    ratedCurrentA: ratingA,
    ratedCurrentRangeA: ratingRange(item),
    poles: item?.poles || null,
    breakingCapacityKA: item?.breakingCapacityKA || null,
    serviceBreakingCapacityKA: item?.serviceBreakingCapacityKA || item?.icsKA || null,
    standard: item?.standard || null,
    quantity,
    bankMatched: Boolean(item),
    ...extra,
  };
}
function phaseInfo(load = {}, inverter = {}) {
  const phaseRaw = normalizeText(load.phaseAC || load.phase || inverter.phase);
  const voltage = num(load.voltageAC || inverter.outputVoltage, 230);
  const three = phaseRaw.includes('three') || phaseRaw.includes('3') || phaseRaw.includes('سه') || voltage >= 380;
  return { three, voltage: three ? Math.max(voltage, 380) : voltage, poles: three ? '4P / 3P+N' : '2P / 1P+N' };
}
function readFaultCurrentKA(input = {}, side = 'ac') {
  const fault = input.shortCircuit || input.fault || input.protectionInputs || input.site?.shortCircuit || {};
  const candidates = side === 'ac'
    ? [fault.acProspectiveKA, fault.acFaultCurrentKA, input.acProspectiveShortCircuitKA, input.prospectiveShortCircuitKA]
    : side === 'battery'
      ? [fault.batteryProspectiveKA, fault.dcProspectiveKA, input.batteryProspectiveShortCircuitKA]
      : [fault.pvProspectiveKA, fault.dcProspectiveKA, input.pvProspectiveShortCircuitKA];
  const value = candidates.map((x) => num(x, 0)).find((x) => x > 0);
  return value || null;
}
function readCableAmpacity(input = {}, side = '') {
  const details = input.cableDetails || input.cables || input.systemSettings?.cableDetails || {};
  const names = side === 'PV_DC' ? ['pv','dc','pvDc'] : side === 'BATTERY_DC' ? ['battery','batteryDc','dc'] : ['ac','output','load'];
  for (const name of names) {
    const cable = details?.[name];
    const value = num(cable?.ampacityA || cable?.currentCapacityA || cable?.maxCurrentA || cable?.currentA, 0);
    if (value > 0) return value;
  }
  return null;
}
function cableCoordination(selectedBreakerA, designCurrentA, cableAmpacityA) {
  if (!cableAmpacityA) return { status: 'NEEDS_CABLE_DATA', coordinated: null, designCurrentA, breakerA: selectedBreakerA, cableAmpacityA: null };
  const coordinated = designCurrentA <= selectedBreakerA && selectedBreakerA <= cableAmpacityA;
  return { status: coordinated ? 'PASS' : 'CHECK', coordinated, designCurrentA, breakerA: selectedBreakerA, cableAmpacityA };
}
function selectSpd(side, type, voltageV) {
  return findExact((item) => item.deviceType === 'SPD' && String(item.side).includes(side) && item.spdType === type && maxRatedVoltage(item) >= voltageV)
    || findExact((item) => item.deviceType === 'SPD' && String(item.side).includes(side) && maxRatedVoltage(item) >= voltageV)
    || null;
}
function spdRecord(item, fallback, quantity, voltageV) {
  return rec(item, fallback, null, quantity, {
    spdType: item?.spdType || null,
    ucV: item?.ucV || item?.ratedVoltageV || item?.ucRangeVdc || null,
    upKV: item?.upKV || null,
    inKA: item?.nominalDischargeCurrentKA || item?.inKA || null,
    imaxKA: item?.maxDischargeCurrentKA || item?.imaxKA || null,
    iimpKA: item?.impulseCurrentKA || item?.iimpKA || null,
    systemVoltageV: voltageV,
  });
}
function selectResidualProtection(input = {}, inverter = {}, phase = {}, acRatingA = 0) {
  const residual = input.residualProtection || input.systemSettings?.residualProtection || {};
  const isIndustrial = Boolean(input.project?.industrial || input.projectInfo?.industrial || num(input.load?.totalPowerW, 0) > 30000);
  const sensitivityMA = num(residual.sensitivityMA, isIndustrial ? 300 : 30);
  const hasSixMilliampDcDetection = Boolean(inverter?.dcResidualDetection6mA || inverter?.rcmu6mA || inverter?.integratedRcmu);
  const requestedType = String(residual.type || '').toUpperCase();
  const rcdType = requestedType || (hasSixMilliampDcDetection ? 'A' : 'B');
  const deviceType = residual.preferRcbo ? 'RCBO' : 'RCD';
  const item = findExact((x) => x.deviceType === deviceType && String(x.side).includes('AC') && (!x.rcdType || x.rcdType === rcdType) && (!x.sensitivityMA || x.sensitivityMA === sensitivityMA) && (!ratingRange(x).length || rangeIncludes(ratingRange(x), acRatingA)))
    || findExact((x) => x.deviceType === deviceType && String(x.side).includes('AC') && (!x.rcdType || x.rcdType === rcdType) && (!ratingRange(x).length || rangeIncludes(ratingRange(x), acRatingA)));
  return rec(item, `${deviceType} Type ${rcdType} ${sensitivityMA}mA`, acRatingA || null, 1, {
    rcdType,
    sensitivityMA,
    polesRequired: phase.three ? '4P' : '2P',
    reason: hasSixMilliampDcDetection ? 'اینورتر دارای پایش مؤلفه DC با سطح 6mA اعلام شده است.' : 'در نبود اعلام پایش 6mA DC توسط اینورتر، انتخاب محافظه‌کارانه Type B ثبت شد.',
  });
}

export const protectionRule = Object.freeze({
  id: 'protection',
  title: 'محاسبه هوشمند حفاظت PV / Battery / AC',
  version: '4.0.0',
  run(input = {}, result = {}) {
    const emergency = input.emergencyDesign || input.systemSettings?.design || input.settings?.design || {};
    const solar = result.solarDesign || result.values?.solarDesign || {};
    const load = solar.load || emergency.load || result.load || input.load || {};
    const inverter = solar.inverter || emergency.inverter || result.equipment?.inverter || input.inverter || {};
    const batteryBlock = solar.battery || emergency.battery || result.batteryDesign || {};
    const battery = batteryBlock.item || result.equipment?.battery || input.battery || {};
    const pvArray = solar.pvArray || result.pvArray || {};
    const panel = solar.panel || result.equipment?.panel || input.panel || {};
    const inverterCount = Math.max(1, Math.ceil(num(inverter.count || pvArray.inverterCount, 1)));
    const mpptCount = Math.max(1, Math.ceil(num(inverter.mpptCount || inverter.mpptChannels, 1)));
    const totalStrings = Math.max(1, Math.ceil(num(pvArray.totalStringCount || pvArray.parallelCount * inverterCount, inverterCount * mpptCount)));
    const stringsPerMppt = Math.max(1, Math.ceil(totalStrings / Math.max(1, inverterCount * mpptCount)));
    const hasPv = Boolean(Object.keys(solar || {}).length && (solar?.panel || panel?.id || num(panel?.powerW || panel?.ratedPowerW, 0) > 0));
    const panelIsc = num(panel.isc || panel.shortCircuitCurrentA || panel.imp, 0);
    const panelVoc = num(panel.voc || panel.openCircuitVoltageV, 0);
    const seriesCount = Math.max(1, Math.ceil(num(pvArray.seriesCount, 1)));
    const pvVoltage = num(result.values?.stringVocCold || result.values?.stringVocCorrectedV, panelVoc * seriesCount || inverter.maxPvVocV || inverter.maxPvVoc || 1000);
    const pvOperatingCurrentA = panelIsc * stringsPerMppt;
    const pvDesignCurrentA = round(pvOperatingCurrentA * 1.25, 2);
    const pvRatingA = nextStandardAmp(pvDesignCurrentA);

    const phase = phaseInfo(load, inverter);
    const pf = Math.min(1, Math.max(0.7, num(load.powerFactor || input.powerFactor, 0.9)));
    const invEfficiency = Math.min(1, Math.max(0.5, num(inverter.efficiency, 0.93)));
    const powerW = num(load.finalPowerW || load.totalPowerW || load.loadPowerW || result.values?.designLoadW || inverter.designPowerW || inverter.ratedPowerW || inverter.powerW, 0);
    const acOperatingCurrentA = phase.three ? powerW / (Math.sqrt(3) * Math.max(phase.voltage,1) * pf) : powerW / (Math.max(phase.voltage,1) * pf);
    const acDesignCurrentA = round(acOperatingCurrentA * 1.25, 2);
    const acRatingA = nextStandardAmp(acDesignCurrentA);

    const batteryVoltage = num(batteryBlock.packVoltage || inverter.batteryVoltage || inverter.dcVoltage || battery.nominalVoltage, 0);
    const hasBattery = Boolean(solar.system?.needsBattery || batteryBlock?.count > 0 || (batteryVoltage > 0 && !inverter.noBatteryRequired));
    const batteryOperatingCurrentA = hasBattery && batteryVoltage > 0 ? powerW / (batteryVoltage * invEfficiency) : 0;
    const batteryDesignCurrentA = round(batteryOperatingCurrentA * 1.25, 2);
    const batteryRatingA = hasBattery ? nextStandardAmp(batteryDesignCurrentA) : 0;

    const pvFaultKA = readFaultCurrentKA(input, 'pv');
    const batteryFaultKA = readFaultCurrentKA(input, 'battery');
    const acFaultKA = readFaultCurrentKA(input, 'ac');
    const pvBreakerType = pvRatingA <= 125 ? 'DC_MCB' : 'DC_MCCB';
    const acBreakerType = acRatingA <= 125 ? 'AC_BREAKER' : 'AC_MCCB';
    const batteryBreakerType = batteryRatingA <= 125 ? 'DC_MCB' : 'DC_MCCB';
    const pvBreaker = selectDevice(pvBreakerType, pvRatingA, pvVoltage, 'PV_DC', pvFaultKA);
    const pvFuse = selectDevice('PV_FUSE', nextStandardAmp(Math.max(panelIsc * 1.25, 1)), pvVoltage, 'PV_DC', pvFaultKA);
    const pvIsolator = selectDevice(['DC_ISOLATOR','DC_LOAD_DISCONNECTOR'], pvRatingA, pvVoltage, pvRatingA > 32 ? '' : 'PV_DC');
    const acBreaker = selectDevice([acBreakerType,'AC_BREAKER','AC_MCCB'], acRatingA, phase.voltage, 'AC', acFaultKA);
    const batteryFuse = selectDevice('BATTERY_FUSE', batteryRatingA, batteryVoltage, 'BATTERY', batteryFaultKA);
    const batteryBreaker = selectDevice([batteryBreakerType,'BATTERY_BREAKER','DC_MCCB'], batteryRatingA, batteryVoltage, '', batteryFaultKA);
    const batteryIsolator = selectDevice(['BATTERY_ISOLATOR','DC_LOAD_DISCONNECTOR','DC_ISOLATOR'], batteryRatingA, batteryVoltage, '');

    const lightningRisk = normalizeText(input.environment?.lightningRisk || input.site?.lightningRisk || solar.handoff?.environmentSnapshot?.lightningRisk || 'normal');
    const externalLightningProtection = Boolean(input.environment?.externalLightningProtection || input.site?.externalLightningProtection || input.environment?.lps);
    const highLightning = lightningRisk.includes('high') || lightningRisk.includes('زیاد') || externalLightningProtection;
    const pvSpdType = highLightning ? 'T1+T2' : 'T2';
    const acSpdType = highLightning ? 'T1+T2' : 'T2';
    const pvSpd = selectSpd('PV_DC', pvSpdType, pvVoltage);
    const acSpd = selectSpd('AC', acSpdType, phase.voltage);
    const residualSelection = selectResidualProtection(input, inverter, phase, acRatingA);

    const stringFuseRatingA = nextStandardAmp(Math.max(panelIsc * 1.25, 1));
    const pvCableCoordination = cableCoordination(pvRatingA, pvDesignCurrentA, readCableAmpacity(input, 'PV_DC'));
    const batteryCableCoordination = cableCoordination(batteryRatingA, batteryDesignCurrentA, readCableAmpacity(input, 'BATTERY_DC'));
    const acCableCoordination = cableCoordination(acRatingA, acDesignCurrentA, readCableAmpacity(input, 'AC'));

    const protection = {
      source: 'SHIL_PROTECTION_ENGINE_V4',
      brand: 'SHIL',
      standardBasis: ['IEC 62548-1:2023 + AMD1:2025', 'IEC 60364-7-712:2025', 'IEC 60947-2:2024', 'IEC 60947-3', 'IEC 60269-6', 'IEC 61643-31:2018'],
      shortCircuitAssessment: {
        pvProspectiveKA: pvFaultKA,
        batteryProspectiveKA: batteryFaultKA,
        acProspectiveKA: acFaultKA,
        status: pvFaultKA || batteryFaultKA || acFaultKA ? 'PARTIAL_OR_COMPLETE' : 'SITE_DATA_REQUIRED',
        note: 'قدرت قطع فقط در صورت وجود جریان اتصال‌کوتاه محتمل پروژه قابل تأیید نهایی است.',
      },
      pvDc: hasPv ? {
        required: true,
        brand: 'SHIL',
        designVoltageV: round(pvVoltage, 2), operatingCurrentA: round(pvOperatingCurrentA, 2), currentA: pvDesignCurrentA, breakerA: pvRatingA,
        breakerType: pvRatingA <= 125 ? 'DC MCB' : 'DC MCCB', breaker: `SHIL ${pvRatingA} A ${pvRatingA <= 125 ? 'DC MCB' : 'DC MCCB'}`,
        breakerSelection: rec(pvBreaker, `${pvRatingA} A ${pvRatingA <= 125 ? 'DC MCB' : 'DC MCCB'}`, pvRatingA, inverterCount * mpptCount, { requiredBreakingCapacityKA: pvFaultKA, breakingCapacityVerified: pvFaultKA ? Boolean(pvBreaker) : null }),
        fuseA: stringFuseRatingA, fuse: `SHIL ${stringFuseRatingA} A gPV Fuse`, fuseSelection: rec(pvFuse, `${stringFuseRatingA} A gPV Fuse`, stringFuseRatingA, totalStrings, { requiredBreakingCapacityKA: pvFaultKA }),
        spd: pvSpd?.title || `SHIL SPD DC ${pvSpdType}`, spdSelection: spdRecord(pvSpd, `SPD DC ${pvSpdType}`, inverterCount, pvVoltage),
        isolator: `SHIL ${pvRatingA} A DC Isolator`, isolatorSelection: rec(pvIsolator, `${pvRatingA} A DC Isolator`, pvRatingA, inverterCount),
        poles: '2P/4P متناسب با توپولوژی', inverterCount, mpptCount, totalStrings, stringsPerMppt,
        cableCoordination: pvCableCoordination,
        standards: ['IEC 62548-1:2023 + AMD1:2025', 'IEC 60364-7-712:2025', 'IEC 60269-6', 'IEC 61643-31:2018'],
      } : { required: false, designVoltageV: 0, currentA: 0, inverterCount, mpptCount: 0, totalStrings: 0 },
      batteryDc: hasBattery ? {
        required: true,
        brand: 'SHIL',
        designVoltageV: round(batteryVoltage, 2), operatingCurrentA: round(batteryOperatingCurrentA, 2), currentA: batteryDesignCurrentA,
        fuseA: batteryRatingA, fuse: `SHIL ${batteryRatingA} A Battery DC Fuse`, fuseSelection: rec(batteryFuse, `${batteryRatingA} A Battery DC Fuse`, batteryRatingA, inverterCount, { requiredBreakingCapacityKA: batteryFaultKA }),
        breakerA: batteryRatingA, breakerType: batteryRatingA <= 125 ? 'DC MCB' : 'DC MCCB', breaker: `SHIL ${batteryRatingA} A ${batteryRatingA <= 125 ? 'DC MCB' : 'DC MCCB'}`,
        breakerSelection: rec(batteryBreaker, `${batteryRatingA} A ${batteryRatingA <= 125 ? 'DC MCB' : 'DC MCCB'}`, batteryRatingA, inverterCount, { requiredBreakingCapacityKA: batteryFaultKA, breakingCapacityVerified: batteryFaultKA ? Boolean(batteryBreaker) : null }),
        isolator: `SHIL ${batteryRatingA} A Battery DC Isolator`, isolatorSelection: rec(batteryIsolator, `${batteryRatingA} A Battery DC Isolator`, batteryRatingA, inverterCount),
        quantity: inverterCount,
        cableCoordination: batteryCableCoordination,
        standards: ['IEC 60364-7-712:2025', 'IEC 60947-2:2024', 'IEC 60947-3', 'IEC 60269'],
      } : { required: false, designVoltageV: 0, currentA: 0, quantity: 0 },
      ac: {
        required: true,
        brand: 'SHIL',
        designVoltageV: round(phase.voltage, 2), phase: phase.three ? 'سه‌فاز' : 'تک‌فاز', powerFactor: pf,
        operatingCurrentA: round(acOperatingCurrentA, 2), currentA: acDesignCurrentA, breakerA: acRatingA,
        breakerType: acRatingA <= 125 ? 'MCB' : 'MCCB', breaker: `SHIL ${acRatingA} A ${acRatingA <= 125 ? 'MCB' : 'MCCB'}`,
        breakerSelection: rec(acBreaker, `${acRatingA} A ${acRatingA <= 125 ? 'MCB' : 'MCCB'}`, acRatingA, inverterCount, { requiredBreakingCapacityKA: acFaultKA, breakingCapacityVerified: acFaultKA ? Boolean(acBreaker) : null }),
        poles: phase.poles,
        spd: acSpd?.title || `SHIL SPD AC ${acSpdType}`, spdSelection: spdRecord(acSpd, `SPD AC ${acSpdType}`, inverterCount, phase.voltage),
        residualProtection: residualSelection,
        quantity: inverterCount,
        cableCoordination: acCableCoordination,
        standards: ['IEC 60364-7-712:2025', 'IEC 60947-2:2024', 'IEC 61643-11'],
      },
    };

    const warnings = [];
    if (hasPv && !pvBreaker) warnings.push({ code: 'PROTECTION_BANK_PV_BREAKER_FALLBACK', message: 'کلید DC SHIL با رنج/قدرت قطع دقیق در بانک پیدا نشد؛ ریتینگ استاندارد محاسبه شده و برای انتخاب نهایی باید داده اتصال‌کوتاه و کاتالوگ SHIL تطبیق داده شود.' });
    if (hasBattery && !batteryFuse) warnings.push({ code: 'PROTECTION_BANK_BATTERY_FALLBACK', message: 'فیوز باتری SHIL با رنج دقیق در بانک پیدا نشد؛ ریتینگ استاندارد محاسبه شده و نیازمند تطبیق کاتالوگی SHIL است.' });
    if (!acBreaker) warnings.push({ code: 'PROTECTION_BANK_AC_BREAKER_FALLBACK', message: 'کلید AC SHIL با رنج/قدرت قطع دقیق در بانک پیدا نشد؛ ریتینگ استاندارد محاسبه شده و نیازمند تطبیق کاتالوگی SHIL است.' });
    if (!acFaultKA) warnings.push({ code: 'PROSPECTIVE_SHORT_CIRCUIT_REQUIRED', message: 'جریان اتصال‌کوتاه محتمل سمت AC ثبت نشده است؛ Icu/Ics نهایی تا ورود این داده تأیید قطعی نمی‌شود.' });
    if (pvCableCoordination.status === 'CHECK' || batteryCableCoordination.status === 'CHECK' || acCableCoordination.status === 'CHECK') warnings.push({ code: 'CABLE_PROTECTION_COORDINATION_CHECK', message: 'در حداقل یکی از مدارها ریتینگ کلید از ظرفیت جریان مجاز کابل بیشتر است و باید سطح مقطع/کلید اصلاح شود.' });
    const breakerSelections = [hasPv ? protection.pvDc?.breakerSelection : null, hasBattery ? protection.batteryDc?.breakerSelection : null, protection.ac?.breakerSelection].filter(Boolean);
    if (breakerSelections.some((x) => x.bankMatched && !x.serviceBreakingCapacityKA)) warnings.push({ code: 'ICS_CATALOG_DATA_REQUIRED', message: 'Icu از بانک SHIL کنترل شده است، اما Ics برای حداقل یکی از کلیدها در داده فعلی کاتالوگ ثبت نشده و باید قبل از تأیید اجرایی تکمیل شود.' });
    if ((hasPv && !protection.pvDc?.spdSelection?.upKV) || !protection.ac?.spdSelection?.upKV) warnings.push({ code: 'SPD_UP_CATALOG_DATA_REQUIRED', message: 'پارامتر Up برای حداقل یکی از SPDهای SHIL در بانک فعلی کامل نیست؛ انتخاب Type/Uc/In/Imax انجام شده ولی تأیید Up نیازمند داده کاتالوگی است.' });
    if (!residualSelection.bankMatched) warnings.push({ code: 'RCD_BANK_REVIEW', message: 'نوع RCD/RCBO موردنیاز محاسبه شده ولی رکورد دقیق آن در بانک SHIL نیازمند تکمیل/تطبیق کاتالوگ است.' });

    return {
      values: { protection, protectionBankConnected: true },
      equipment: { protection },
      warnings,
      explanations: [{ rule: 'protection', message: 'حفاظت SHIL برای PV، باتری و AC از جریان واقعی سیستم، ضریب طراحی، نوع فاز، SPD، حفاظت نشتی، قدرت قطع و هماهنگی کابل محاسبه شد.' }],
    };
  },
});
