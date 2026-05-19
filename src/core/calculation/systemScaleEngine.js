const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};

const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const round = (value, digits = 2) => Number(num(value, 0).toFixed(digits));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));

const SCALE_LABELS = {
  small: 'خانگی / کوچک',
  commercial: 'تجاری / صنعتی سبک',
  industrial: 'صنعتی بزرگ',
  utility: 'نیروگاهی',
  mega_utility: 'نیروگاهی بزرگ'
};

function autoScale(powerW) {
  if (powerW <= 30_000) return 'small';
  if (powerW <= 500_000) return 'commercial';
  if (powerW <= 2_000_000) return 'industrial';
  if (powerW <= 10_000_000) return 'utility';
  return 'mega_utility';
}

function blockSizeFor(powerW, requestedKW = 0) {
  if (requestedKW > 0) return requestedKW * 1000;
  if (powerW <= 30_000) return powerW;
  if (powerW <= 500_000) return 30_000;
  if (powerW <= 2_000_000) return 250_000;
  if (powerW <= 10_000_000) return 500_000;
  return 1_000_000;
}

export function runSystemScaleEngine({ designPowerW = 0, inverter = {}, inverterCount = 1, settings = {} } = {}) {
  const requestedMW = num(settings.targetPlantPowerMW, 0);
  const requestedKW = num(settings.targetPlantPowerKW, 0);
  const manualTargetW = requestedMW > 0 ? requestedMW * 1_000_000 : requestedKW > 0 ? requestedKW * 1000 : 0;
  const targetPowerW = Math.max(num(designPowerW, 0), manualTargetW);
  const cappedPowerW = clamp(targetPowerW, 0, 30_000_000);
  const scaleType = settings.projectScale && settings.projectScale !== 'auto' ? settings.projectScale : autoScale(cappedPowerW);
  const blockPowerW = blockSizeFor(cappedPowerW, num(settings.powerBlockSizeKW, 0));
  const blockCount = cappedPowerW > 0 ? ceil(cappedPowerW / Math.max(1, blockPowerW)) : 1;
  const actualBlockPowerW = cappedPowerW / blockCount;
  const inverterRatedPowerW = Math.max(1, num(inverter.ratedPowerW, 30_000));
  const totalInverterCount = Math.max(num(inverterCount, 1), ceil(cappedPowerW / inverterRatedPowerW));
  const inverterPerBlock = ceil(totalInverterCount / blockCount);
  const acCapacityMW = cappedPowerW / 1_000_000;
  const dcAcRatio = clamp(num(settings.dcAcRatio, scaleType === 'small' ? 1.1 : 1.2), 1, 1.4);
  const targetDcPowerW = cappedPowerW * dcAcRatio;

  const designMode = cappedPowerW <= 30_000
    ? 'single_inverter'
    : cappedPowerW <= 500_000
      ? 'multi_inverter'
      : 'block_based_power_plant';

  const warnings = [];
  const engineeringNotes = [];
  if (targetPowerW > 30_000_000) {
    warnings.push('توان واردشده بالاتر از سقف طراحی SHIL است؛ محاسبات در این نسخه تا ۳۰ مگاوات محدود می‌شود.');
  }
  if (cappedPowerW > 30_000) {
    engineeringNotes.push('ظرفیت از محدوده اینورتر تکی خارج است؛ طراحی به صورت چند اینورتر موازی یا بلوک‌بندی نیروگاهی تحلیل می‌شود.');
  }
  if (cappedPowerW > 500_000) {
    engineeringNotes.push('پروژه در مقیاس نیروگاهی قرار دارد؛ خروجی‌ها باید بر اساس بلوک توان، آرایش رشته‌ها، MPPT، حفاظت و تابلوهای تجمیع بررسی شوند.');
  }
  if (cappedPowerW >= 5_000_000 && inverterRatedPowerW <= 30_000) {
    warnings.push('استفاده از اینورتر ۳۰ کیلووات برای مقیاس چندمگاواتی ممکن است، اما خروجی SHIL آن را به عنوان طراحی بلوک‌بندی‌شده و نیازمند بازبینی مهندسی صنعتی علامت‌گذاری می‌کند.');
  }

  return {
    targetPowerW: round(cappedPowerW, 0),
    targetPowerKW: round(cappedPowerW / 1000, 2),
    targetPowerMW: round(acCapacityMW, 3),
    targetDcPowerW: round(targetDcPowerW, 0),
    targetDcPowerMW: round(targetDcPowerW / 1_000_000, 3),
    dcAcRatio,
    maxSupportedPowerMW: 30,
    scaleType,
    scaleLabel: SCALE_LABELS[scaleType] || SCALE_LABELS.utility,
    designMode,
    designModeLabel: designMode === 'single_inverter' ? 'اینورتر تکی' : designMode === 'multi_inverter' ? 'چند اینورتر موازی' : 'بلوک‌بندی نیروگاهی',
    blockPowerW: round(blockPowerW, 0),
    blockPowerKW: round(blockPowerW / 1000, 2),
    blockPowerMW: round(blockPowerW / 1_000_000, 3),
    blockCount,
    actualBlockPowerW: round(actualBlockPowerW, 0),
    actualBlockPowerKW: round(actualBlockPowerW / 1000, 2),
    actualBlockPowerMW: round(actualBlockPowerW / 1_000_000, 3),
    inverterRatedPowerW: round(inverterRatedPowerW, 0),
    totalInverterCount,
    inverterPerBlock,
    warnings,
    engineeringNotes,
    recommendations: [
      cappedPowerW > 500_000 ? 'برای خروجی نهایی، هر بلوک نیروگاهی جداگانه از نظر String، MPPT، حفاظت DC/AC، تابلو تجمیع و کابل‌کشی تحلیل شود.' : 'محاسبه در محدوده پروژه کوچک/تجاری قابل انجام است.',
      'این ماژول فقط تحلیل مهندسی انجام می‌دهد و هیچ داده قیمت، فروش یا خرید وارد محاسبه نمی‌شود.'
    ]
  };
}
