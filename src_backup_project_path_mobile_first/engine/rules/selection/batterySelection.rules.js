import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';
import { byId, enabled, pickFirstCompatible } from '../../utils/selectors.js';
import { ceil, round } from '../../utils/number.js';

export const batterySelectionRule = Object.freeze({
  id: 'batterySelection',
  title: 'انتخاب باتری و ظرفیت',
  version: '2.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    if (n.scenario === 'ongrid') {
      return {
        values: { requiredBatteryEnergyKWh: 0, batteryCount: 0, batteryBankConnected: true },
        explanations: [{ rule: 'batterySelection', message: 'در سناریوی آنگرید، باتری به‌صورت پیش‌فرض الزامی در نظر گرفته نشد.' }],
      };
    }

    const batteries = enabled('batteries').sort((a, b) => (a.energyWh || 0) - (b.energyWh || 0));
    const inverterVoltage = result.values?.inverterBatteryVoltage || 48;
    const selected = byId('batteries', n.selected.batteryId);
    const dailyNeed = (result.values?.designDailyEnergyKWh || n.dailyEnergyKWh || 0) * n.autonomyDays;
    const backupNeed = ((result.values?.designLoadW || n.peakLoadW || 0) * n.backupHours) / 1000;
    const requiredBatteryEnergyKWh = round(Math.max(dailyNeed, backupNeed, 0) / 0.9, 2);
    const voltageTolerance = Math.max(3, inverterVoltage * 0.1);
    const battery = selected || pickFirstCompatible(batteries, (item) =>
      Math.abs((item.nominalVoltage || item.voltage || 0) - inverterVoltage) <= voltageTolerance
    ) || batteries[batteries.length - 1] || null;

    if (!battery) return { warnings: [{ code: 'NO_BATTERY_BANK', message: 'بانک باتری در Registry خالی است.' }], skippedRules: ['batterySelection'] };

    const batteryEnergyKWh = (battery.energyWh || ((battery.nominalVoltage || inverterVoltage) * (battery.capacityAh || 0))) / 1000;
    const usableBatteryEnergyKWh = batteryEnergyKWh * (battery.usableDod || 0.9) * (battery.efficiency || 0.94);
    const batteryCount = requiredBatteryEnergyKWh > 0 ? ceil(requiredBatteryEnergyKWh / Math.max(usableBatteryEnergyKWh, 0.1), 1) : 1;
    const parallelBranches = batteryCount;

    return {
      equipment: { battery },
      values: {
        requiredBatteryEnergyKWh,
        batteryEnergyKWh: round(batteryEnergyKWh, 2),
        usableBatteryEnergyKWh: round(usableBatteryEnergyKWh, 2),
        batteryCount,
        batteryParallelBranches: parallelBranches,
        totalUsableBatteryEnergyKWh: round(usableBatteryEnergyKWh * batteryCount, 2),
        batteryVoltage: battery.nominalVoltage || inverterVoltage,
        batteryBankConnected: true,
      },
      explanations: [{ rule: 'batterySelection', message: `باتری از بانک SHIL بر اساس انرژی پشتیبان و ولتاژ اینورتر انتخاب شد: ${battery.title || battery.label} با تعداد ${batteryCount} عدد.` }],
    };
  },
});
