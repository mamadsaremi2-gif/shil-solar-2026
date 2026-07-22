import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';
import { clamp, ceil, round } from '../../utils/number.js';

export const stringDesignRule = Object.freeze({
  id: 'stringDesign',
  title: 'طراحی رشته پنل و MPPT',
  version: '1.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    const panel = result.equipment?.panel;
    const inverter = result.equipment?.inverter;
    const panelCount = result.values?.panelCount || 0;
    if (!panel || !inverter || panelCount <= 0) {
      return { warnings: [{ code: 'STRING_DESIGN_SKIPPED', message: 'برای طراحی String، پنل/اینورتر/تعداد پنل لازم است.' }], skippedRules: ['stringDesign'] };
    }

    const voc = panel.voc || 50;
    const vmp = panel.vmp || 42;
    const tempCoeffAbs = Math.abs(panel.tempCoeffVocPctC || 0.28) / 100;
    const coldVoc = voc * (1 + tempCoeffAbs * (25 - n.ambientMinC));
    const maxVoc = inverter.maxPvVocV || inverter.maxPvVoc || 500;
    const mpptMin = inverter.mpptMinV || 60;
    const mpptMax = inverter.mpptMaxV || maxVoc * 0.9;

    const maxSeriesByVoc = Math.max(1, Math.floor(maxVoc / Math.max(coldVoc, 1)));
    const maxSeriesByMppt = Math.max(1, Math.floor(mpptMax / Math.max(vmp, 1)));
    const minSeriesByMppt = Math.max(1, Math.ceil(mpptMin / Math.max(vmp, 1)));
    const seriesPanels = clamp(Math.min(maxSeriesByVoc, maxSeriesByMppt, panelCount), minSeriesByMppt, Math.max(minSeriesByMppt, maxSeriesByVoc));
    const parallelStrings = ceil(panelCount / seriesPanels, 1);
    const panelsUsed = seriesPanels * parallelStrings;
    const stringVmp = round(seriesPanels * vmp, 2);
    const stringVocCold = round(seriesPanels * coldVoc, 2);
    const pvCurrentA = round(parallelStrings * (panel.imp || panel.isc || 13), 2);
    const mpptCount = inverter.mpptCount || 1;
    const stringsPerMppt = ceil(parallelStrings / mpptCount, 1);

    const warnings = [];
    if (stringVocCold > maxVoc) warnings.push({ code: 'PV_VOC_OVER_LIMIT', message: 'ولتاژ مدار باز رشته در هوای سرد از حد اینورتر بیشتر است.' });
    if (stringVmp < mpptMin || stringVmp > mpptMax) warnings.push({ code: 'PV_VMP_OUTSIDE_MPPT', message: 'ولتاژ کاری رشته خارج از محدوده MPPT اینورتر است.' });

    return {
      values: {
        seriesPanels,
        parallelStrings,
        panelsUsed,
        stringVmp,
        stringVocCold,
        pvCurrentA,
        stringsPerMppt,
        mpptCount,
      },
      warnings,
      explanations: [{ rule: 'stringDesign', message: `طراحی پیشنهادی: ${seriesPanels} پنل سری × ${parallelStrings} رشته موازی.` }],
    };
  },
});
