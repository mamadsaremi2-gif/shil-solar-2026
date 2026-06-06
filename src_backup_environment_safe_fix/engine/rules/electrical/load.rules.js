import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';
import { round } from '../../utils/number.js';

export const loadEstimationRule = Object.freeze({
  id: 'loadEstimation',
  title: 'تخمین بار و انرژی پایه',
  version: '1.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    const peakLoadW = n.peakLoadW || (n.dailyEnergyKWh > 0 ? n.dailyEnergyKWh * 1000 / 5 : 0);
    const dailyEnergyKWh = n.dailyEnergyKWh || (peakLoadW > 0 ? peakLoadW * 5 / 1000 : 0);
    const designLoadW = Math.ceil(peakLoadW * 1.25);
    const designDailyEnergyKWh = round(dailyEnergyKWh * 1.15, 2);

    return {
      values: {
        peakLoadW,
        dailyEnergyKWh,
        designLoadW,
        designDailyEnergyKWh,
        loadSafetyFactor: 1.25,
        energySafetyFactor: 1.15,
      },
      explanations: [{ rule: 'loadEstimation', message: 'بار طراحی با ضریب اطمینان ۱.۲۵ و انرژی روزانه با ضریب ۱.۱۵ محاسبه شد.' }],
    };
  },
});
