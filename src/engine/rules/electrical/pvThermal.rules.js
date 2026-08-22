import { round } from '../../utils/number.js';

function n(value, fallback = 0) {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

export const pvThermalRule = Object.freeze({
  id: 'pvThermal',
  title: 'تصحیح حرارتی PV و حاشیه ایمنی ولتاژ',
  version: '18.0.0',
  run(input = {}, result = {}) {
    const panel = result.equipment?.panel || {};
    const inverter = result.equipment?.inverter || {};
    const seriesPanels = n(result.values?.seriesPanels, 0);
    if (!panel || !seriesPanels) {
      return { warnings: [{ code: 'PV_THERMAL_SKIPPED', message: 'برای تصحیح حرارتی، پنل و طراحی سری لازم است.' }], skippedRules: ['pvThermal'] };
    }

    const vocStc = n(panel.voc, n(panel.openCircuitVoltageVoc, 0));
    const vmpStc = n(panel.vmp, n(panel.maxPowerVoltageVmp, 0));
    const pmaxW = n(panel.powerW, n(panel.pmaxW, n(panel.maximumPowerW, 0)));
    const tempCoeffVocPctC = n(panel.tempCoeffVocPctC, n(panel.temperatureCoefficientVocPctC, -0.29));
    const tempCoeffPmaxPctC = n(panel.tempCoeffPmaxPctC, n(panel.temperatureCoefficientPmaxPctC, -0.35));
    const coldC = n(input.ambientMinC ?? input.environment?.ambientMinC ?? result.normalizedInput?.ambientMinC, -5);
    const hotC = n(input.ambientMaxC ?? input.environment?.ambientMaxC ?? result.normalizedInput?.ambientMaxC, 45);
    const cellHotC = hotC + 25;
    const maxPvVocV = n(inverter.maxPvVocV || inverter.maxPvVoc, 500);
    const mpptMinV = n(inverter.mpptMinV, 60);
    const mpptMaxV = n(inverter.mpptMaxV, Math.min(maxPvVocV * 0.9, 450));

    const vocColdPerPanel = round(vocStc * (1 + Math.abs(tempCoeffVocPctC) / 100 * (25 - coldC)), 2);
    const vmpHotPerPanel = round(vmpStc * (1 - Math.abs(tempCoeffVocPctC) / 100 * Math.max(cellHotC - 25, 0)), 2);
    const pmaxHotPerPanel = round(pmaxW * (1 - Math.abs(tempCoeffPmaxPctC) / 100 * Math.max(cellHotC - 25, 0)), 2);
    const stringVocColdV = round(vocColdPerPanel * seriesPanels, 2);
    const stringVmpHotV = round(vmpHotPerPanel * seriesPanels, 2);
    const pvVoltageSafetyMarginPct = round(((maxPvVocV - stringVocColdV) / Math.max(maxPvVocV, 1)) * 100, 2);

    const warnings = [];
    if (stringVocColdV > maxPvVocV) warnings.push({ code: 'PV_COLD_VOC_LIMIT', message: 'ولتاژ Voc اصلاح‌شده در دمای پایین از حد مجاز اینورتر عبور می‌کند.' });
    if (stringVmpHotV < mpptMinV || stringVmpHotV > mpptMaxV) warnings.push({ code: 'PV_HOT_VMP_MPPT_LIMIT', message: 'ولتاژ Vmp اصلاح‌شده در دمای بالا خارج از بازه MPPT است.' });
    if (pvVoltageSafetyMarginPct < 8) warnings.push({ code: 'PV_LOW_VOLTAGE_MARGIN', message: 'حاشیه ایمنی ولتاژ PV پایین است و بهتر است تعداد پنل سری بازبینی شود.' });

    return {
      values: {
        thermal: {
          coldC,
          hotC,
          cellHotC,
          vocColdPerPanel,
          vmpHotPerPanel,
          pmaxHotPerPanel,
          stringVocColdV,
          stringVmpHotV,
          pvVoltageSafetyMarginPct,
          maxPvVocV,
          mpptMinV,
          mpptMaxV,
        },
        stringVocCold: stringVocColdV,
        stringVmpHot: stringVmpHotV,
        pvVoltageSafetyMarginPct,
      },
      warnings,
      explanations: [{ rule: 'pvThermal', message: `Voc سرد ${stringVocColdV}V و Vmp گرم ${stringVmpHotV}V با حاشیه ${pvVoltageSafetyMarginPct}% محاسبه شد.` }],
    };
  },
});
