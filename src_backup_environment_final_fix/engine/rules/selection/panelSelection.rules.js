import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';
import { byId, enabled } from '../../utils/selectors.js';
import { ceil, round } from '../../utils/number.js';

function scorePanel(panel, targetPvPowerW, inverter = {}) {
  const power = panel.powerW || 0;
  const targetCount = power > 0 ? Math.ceil(targetPvPowerW / power) : 999;
  const mpptCurrentLimit = inverter.maxPvInputCurrentA || 999;
  const current = panel.imp || panel.isc || 0;
  const currentPenalty = current > mpptCurrentLimit ? 1000 : 0;
  const densityBonus = panel.efficiency ? panel.efficiency * 30 : 0;
  const preferredCountPenalty = targetCount < 3 ? 80 : targetCount > 24 ? 40 : Math.abs(targetCount - 8);
  const industrialPenalty = targetPvPowerW < 4000 && power > 600 ? 60 : 0;
  const lightPenalty = targetPvPowerW > 8000 && power < 430 ? 60 : 0;
  return currentPenalty + preferredCountPenalty + industrialPenalty + lightPenalty - densityBonus;
}

export const panelSelectionRule = Object.freeze({
  id: 'panelSelection',
  title: 'انتخاب پنل و تعداد پایه',
  version: '2.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    const panels = enabled('panels');
    const manuallySelectedPanel = byId('panels', n.selected.panelId);
    if (!panels.length && !manuallySelectedPanel) {
      return { warnings: [{ code: 'NO_PANEL_BANK', message: 'بانک پنل در Registry خالی است.' }], skippedRules: ['panelSelection'] };
    }

    const inverter = result.equipment?.inverter || {};
    const designDailyEnergyKWh = result.values?.designDailyEnergyKWh || n.dailyEnergyKWh || 0;
    const pvDerate = 0.78;
    const rawTargetPvPowerW = designDailyEnergyKWh > 0
      ? (designDailyEnergyKWh * 1000) / Math.max(n.sunHours * pvDerate, 1)
      : (result.values?.designLoadW || n.peakLoadW || 1000) * 1.3;
    const inverterCap = inverter.maxPvPowerW || Infinity;
    const targetPvPowerW = Math.min(Math.ceil(rawTargetPvPowerW), inverterCap === Infinity ? Math.ceil(rawTargetPvPowerW) : Math.max(Math.ceil(rawTargetPvPowerW), Math.min(inverterCap, (result.values?.designLoadW || 0) * 1.1 || rawTargetPvPowerW)));

    const compatiblePanels = panels.filter((panel) => {
      const maxVoc = inverter.maxPvVocV || inverter.maxPvVoc || panel.maxSystemVoltageV || 1500;
      const mpptMax = inverter.mpptMaxV || maxVoc;
      const mpptMin = inverter.mpptMinV || 0;
      const coldVoc = (panel.voc || 0) * (1 + Math.abs(panel.tempCoeffVocPctC || 0.28) / 100 * (25 - n.ambientMinC));
      const maxSeries = Math.floor(maxVoc / Math.max(coldVoc, 1));
      const minSeries = Math.ceil(mpptMin / Math.max(panel.vmp || 1, 1));
      const maxSeriesMppt = Math.floor(mpptMax / Math.max(panel.vmp || 1, 1));
      return maxSeries >= Math.max(1, minSeries) && maxSeriesMppt >= Math.max(1, minSeries);
    });

    const selectedPanel = manuallySelectedPanel || [...(compatiblePanels.length ? compatiblePanels : panels)]
      .sort((a, b) => scorePanel(a, targetPvPowerW, inverter) - scorePanel(b, targetPvPowerW, inverter))[0] || null;

    if (!selectedPanel) {
      return { warnings: [{ code: 'NO_COMPATIBLE_PANEL', message: 'هیچ پنل سازگار با محدوده اینورتر پیدا نشد.' }], skippedRules: ['panelSelection'] };
    }

    let panelCount = ceil(targetPvPowerW / Math.max(selectedPanel.powerW || 1, 1), 1);
    const maxPvPowerW = inverter.maxPvPowerW || Infinity;
    if (Number.isFinite(maxPvPowerW) && panelCount * selectedPanel.powerW > maxPvPowerW) {
      panelCount = Math.max(1, Math.floor(maxPvPowerW / Math.max(selectedPanel.powerW || 1, 1)));
    }
    const installedPvPowerW = panelCount * selectedPanel.powerW;

    return {
      equipment: { panel: selectedPanel },
      values: {
        pvDerate,
        targetPvPowerW: Math.round(targetPvPowerW),
        panelCount,
        installedPvPowerW,
        installedPvPowerKW: round(installedPvPowerW / 1000, 2),
        panelBankConnected: true,
      },
      explanations: [{ rule: 'panelSelection', message: `پنل از بانک مهندسی SHIL بر اساس توان هدف، محدوده MPPT و جریان اینورتر انتخاب شد: ${selectedPanel.title || selectedPanel.label} با تعداد ${panelCount} عدد.` }],
    };
  },
});
