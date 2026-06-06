import { round } from '../../utils/number.js';

function n(value, fallback = 0) {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

export const batteryAutonomyRule = Object.freeze({
  id: 'batteryAutonomy',
  title: 'تحلیل استقلال باتری، DOD و جریان دشارژ',
  version: '18.0.0',
  run(input = {}, result = {}) {
    const battery = result.equipment?.battery || {};
    const inverter = result.equipment?.inverter || {};
    const count = Math.max(0, n(result.values?.batteryCount, 0));
    const peakLoadW = n(result.values?.designLoadW || result.values?.peakLoadW || input.peakLoadW, 0);
    const backupHours = n(input.backupHours ?? result.normalizedInput?.backupHours, 0);
    const batteryVoltage = n(battery.nominalVoltage || inverter.batteryVoltage || result.values?.batteryVoltage, 48);
    const unitKWh = n(battery.energyKWh || battery.capacityKWh || battery.usableKWh, 1.2);
    const dod = n(battery.dodPct || battery.maxDodPct || 80, 80) / 100;
    const usableKWh = round(count * unitKWh * dod, 2);
    const requiredKWh = round((peakLoadW * backupHours) / 1000, 2);
    const autonomyHours = peakLoadW > 0 ? round((usableKWh * 1000) / peakLoadW, 2) : 0;
    const dischargeCurrentA = round(peakLoadW / Math.max(batteryVoltage, 1), 2);
    const maxDischargeCurrentA = n(battery.maxDischargeCurrentA || battery.dischargeCurrentA || count * 100, count * 100);
    const coverageRatio = requiredKWh > 0 ? round(usableKWh / requiredKWh, 2) : 1;

    const warnings = [];
    if (requiredKWh > 0 && usableKWh < requiredKWh) warnings.push({ code: 'BATTERY_AUTONOMY_SHORT', message: `ظرفیت قابل استفاده باتری ${usableKWh}kWh کمتر از نیاز ${requiredKWh}kWh است.` });
    if (dischargeCurrentA > maxDischargeCurrentA) warnings.push({ code: 'BATTERY_DISCHARGE_CURRENT_LIMIT', message: `جریان دشارژ ${dischargeCurrentA}A از حد مجاز بانک باتری بیشتر است.` });

    return {
      values: {
        batteryAutonomy: {
          count,
          unitKWh,
          dodPct: round(dod * 100, 1),
          usableKWh,
          requiredKWh,
          autonomyHours,
          coverageRatio,
          dischargeCurrentA,
          maxDischargeCurrentA,
          batteryVoltage,
        },
        totalUsableBatteryEnergyKWh: usableKWh,
        batteryCoverageRatio: coverageRatio,
      },
      warnings,
      explanations: [{ rule: 'batteryAutonomy', message: `استقلال باتری ${autonomyHours} ساعت با نسبت پوشش ${coverageRatio} محاسبه شد.` }],
    };
  },
});
