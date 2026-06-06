import { round } from '../../utils/number.js';

function n(value, fallback = 0) {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

export const mpptOptimizerRule = Object.freeze({
  id: 'mpptOptimizer',
  title: 'بهینه‌سازی تخصیص MPPT و String',
  version: '18.0.0',
  run(_input = {}, result = {}) {
    const inverter = result.equipment?.inverter || {};
    const parallelStrings = Math.max(1, n(result.values?.parallelStrings, 1));
    const mpptCount = Math.max(1, n(inverter.mpptCount || result.values?.mpptCount, 1));
    const inverterCount = Math.max(1, n(result.values?.inverterCount, 1));
    const totalMpptCount = mpptCount * inverterCount;
    const base = Math.floor(parallelStrings / totalMpptCount);
    const remainder = parallelStrings % totalMpptCount;
    const stringCurrentA = n(result.equipment?.panel?.imp || result.equipment?.panel?.isc || 13, 13);
    const mpptCurrentLimitA = n(inverter.maxMpptCurrentA || inverter.maxInputCurrentA || 27, 27);

    const allocation = Array.from({ length: totalMpptCount }, (_, index) => {
      const strings = Math.max(0, base + (index < remainder ? 1 : 0));
      const currentA = round(strings * stringCurrentA, 2);
      return {
        mpptId: `MPPT-${index + 1}`,
        inverterIndex: Math.floor(index / mpptCount) + 1,
        localMpptIndex: (index % mpptCount) + 1,
        strings,
        currentA,
        status: currentA <= mpptCurrentLimitA ? 'OK' : 'OVER_CURRENT',
      };
    });

    const warnings = allocation
      .filter((x) => x.status !== 'OK')
      .map((x) => ({ code: 'MPPT_CURRENT_LIMIT', message: `${x.mpptId}: جریان ${x.currentA}A از حد ${mpptCurrentLimitA}A بیشتر است.` }));

    return {
      values: {
        mpptAllocation: allocation,
        totalMpptCount,
        mpptCount,
        stringsBalanced: warnings.length === 0,
      },
      warnings,
      explanations: [{ rule: 'mpptOptimizer', message: `${parallelStrings} رشته روی ${totalMpptCount} کانال MPPT توزیع شد.` }],
    };
  },
});
