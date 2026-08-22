import { enabled } from '../../utils/selectors.js';
import { round } from '../../utils/number.js';

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function selectCable(side, currentA) {
  const cables = enabled('cables')
    .filter((c) => String(c.side || '').toLowerCase().includes(String(side).toLowerCase()))
    .sort((a, b) => (a.currentA || 0) - (b.currentA || 0));
  return cables.find((c) => (c.currentA || 0) >= currentA) || cables[cables.length - 1] || null;
}

function cableSizeMm2(cable) {
  const text = String(cable?.title || cable?.id || '');
  const m = text.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return m ? Number(m[1]) : safeNumber(cable?.sectionMm2 || cable?.crossSectionMm2, 0);
}

function voltageDropPercent({ currentA, lengthM, voltageV, sectionMm2, material = 'copper' }) {
  if (!currentA || !lengthM || !voltageV || !sectionMm2) return 0;
  const rho = material === 'aluminum' ? 0.0282 : 0.0175;
  const dropV = 2 * rho * lengthM * currentA / sectionMm2;
  return round((dropV / voltageV) * 100, 2);
}

function toCableDetail(cable, currentA, voltageV, lengthM, side, allowedDropPercent) {
  const sectionMm2 = cableSizeMm2(cable);
  const dropPercent = voltageDropPercent({ currentA, voltageV, lengthM, sectionMm2 });
  return {
    id: cable?.id || null,
    label: cable?.title || 'نیازمند انتخاب دستی',
    side,
    currentA: round(currentA, 2),
    voltageV: round(voltageV, 2),
    lengthM: round(lengthM, 2),
    sectionMm2,
    ampacityA: cable?.currentA || null,
    voltageDropPercent: dropPercent,
    allowedDropPercent,
    status: dropPercent && dropPercent > allowedDropPercent ? 'نیازمند افزایش سطح مقطع' : 'قابل قبول',
  };
}

export const cableRule = Object.freeze({
  id: 'cable',
  title: 'انتخاب و ارزیابی کابل SHIL',
  version: '16.0.1',
  run(input = {}, result = {}) {
    const protection = result.values?.protection || {};
    const n = result.normalizedInput || {};
    const pvCurrent = protection.pvDc?.currentA || result.values?.pvCurrentA || 0;
    const batteryCurrent = protection.batteryDc?.currentA || 0;
    const acCurrent = protection.ac?.currentA || 0;
    const pvVoltage = protection.pvDc?.designVoltageV || result.values?.stringVmp || 250;
    const batteryVoltage = protection.batteryDc?.designVoltageV || result.values?.batteryVoltage || 48;
    const acVoltage = protection.ac?.designVoltageV || 230;
    const pvCable = selectCable('PV', pvCurrent);
    const batteryCable = selectCable('Battery', batteryCurrent) || selectCable('DC', batteryCurrent);
    const acCable = selectCable('AC', acCurrent);

    const details = {
      pv: toCableDetail(pvCable, pvCurrent, pvVoltage, safeNumber(input.dcDistanceM || n.dcDistanceM, 15), 'PV/DC', 3),
      battery: toCableDetail(batteryCable, batteryCurrent, batteryVoltage, safeNumber(input.batteryDistanceM || n.batteryDistanceM, 3), 'Battery/DC', 2),
      ac: toCableDetail(acCable, acCurrent, acVoltage, safeNumber(input.acDistanceM || n.acDistanceM, 20), 'AC', 3),
    };

    const warnings = Object.entries(details)
      .filter(([, d]) => d.voltageDropPercent && d.voltageDropPercent > d.allowedDropPercent)
      .map(([key, d]) => ({ code: `CABLE_DROP_${key.toUpperCase()}`, message: `${d.label}: افت ولتاژ ${d.voltageDropPercent}% از حد مجاز ${d.allowedDropPercent}% بیشتر است.` }));

    return {
      equipment: { cables: { pv: pvCable, battery: batteryCable, ac: acCable } },
      values: {
        cables: {
          pv: details.pv.label,
          battery: details.battery.label,
          ac: details.ac.label,
        },
        cableDetails: details,
        cableBankConnected: true,
      },
      warnings,
      explanations: [{ rule: 'cable', message: 'کابل‌ها بر اساس جریان طراحی، طول مسیر و کنترل افت ولتاژ اولیه انتخاب شدند.' }],
    };
  },
});
