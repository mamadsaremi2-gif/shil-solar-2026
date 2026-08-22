import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';
import { byId, enabled, pickFirstCompatible } from '../../utils/selectors.js';

function scenarioMatches(inverter, scenario) {
  const type = String(inverter.type || '').toLowerCase();
  if (scenario === 'ongrid') return type.includes('on');
  if (scenario === 'hybrid') return type.includes('hybrid') || type.includes('hi');
  return type.includes('off') || type.includes('si') || type.includes('hybrid');
}

export const inverterSelectionRule = Object.freeze({
  id: 'inverterSelection',
  title: 'انتخاب اینورتر',
  version: '1.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    const inverters = enabled('inverters').sort((a, b) => (a.ratedPowerW || 0) - (b.ratedPowerW || 0));
    const selected = byId('inverters', n.selected.inverterId);
    const designLoadW = result.values?.designLoadW || n.peakLoadW || 0;
    const installedPvPowerW = result.values?.installedPvPowerW || 0;
    const inverter = selected || pickFirstCompatible(inverters, (item) =>
      scenarioMatches(item, n.scenario) &&
      (item.ratedPowerW || 0) >= designLoadW &&
      (installedPvPowerW <= 0 || (item.maxPvPowerW || Infinity) >= installedPvPowerW * 0.9)
    ) || inverters[inverters.length - 1] || null;

    if (!inverter) return { warnings: [{ code: 'NO_INVERTER_BANK', message: 'بانک اینورتر در Registry خالی است.' }], skippedRules: ['inverterSelection'] };

    return {
      equipment: { inverter },
      values: {
        inverterRatedPowerW: inverter.ratedPowerW || 0,
        inverterBatteryVoltage: inverter.batteryVoltage || inverter.dcVoltage || 48,
        inverterMpptCount: inverter.mpptCount || 1,
        inverterMpptMinV: inverter.mpptMinV || 0,
        inverterMpptMaxV: inverter.mpptMaxV || inverter.maxPvVocV || 500,
        inverterMaxPvVocV: inverter.maxPvVocV || inverter.maxPvVoc || 500,
        inverterMaxPvPowerW: inverter.maxPvPowerW || 0,
        inverterMaxPvInputCurrentA: inverter.maxPvInputCurrentA || 0,
        inverterBankConnected: true,
      },
      explanations: [{ rule: 'inverterSelection', message: `اینورتر از بانک SHIL بر اساس سناریو، توان بار و قیود PV انتخاب شد: ${inverter.title || inverter.label}.` }],
    };
  },
});
