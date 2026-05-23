const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 2) => Number(num(value, 0).toFixed(digits));
const ceil = (value) => Math.max(1, Math.ceil(num(value, 0)));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));

function pickMvVoltageKV(acPowerMW, manualKV) {
  const manual = num(manualKV, 0);
  if (manual > 0) return manual;
  if (acPowerMW <= 1) return 0.4;
  if (acPowerMW <= 5) return 11;
  if (acPowerMW <= 25) return 20;
  return 33;
}

function pickBlockStationMW(acPowerMW, manualBlockMW) {
  const manual = num(manualBlockMW, 0);
  if (manual > 0) return manual;
  if (acPowerMW <= 2) return 0.5;
  if (acPowerMW <= 10) return 1;
  if (acPowerMW <= 25) return 2.5;
  return 5;
}

function buildMonthlyYield(annualKWh, psh = 5.2) {
  const seasonal = [0.64, 0.72, 0.88, 1.02, 1.12, 1.2, 1.22, 1.15, 1.02, 0.88, 0.72, 0.63];
  const total = seasonal.reduce((a, b) => a + b, 0);
  const names = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  return seasonal.map((factor, index) => ({
    month: names[index],
    yieldKWh: round(annualKWh * factor / total, 0),
    relativePsh: round(psh * factor, 2)
  }));
}

export function runUtilityElectricalEngine({ systemScale = {}, pvArray = {}, inverter = {}, inverterCount = 1, env = {}, settings = {} } = {}) {
  const acPowerMW = Math.max(num(systemScale.targetPowerMW, 0), num(systemScale.targetPowerKW, 0) / 1000, num(systemScale.targetPowerW, 0) / 1_000_000);
  const dcPowerMW = Math.max(num(systemScale.targetDcPowerMW, 0), num(pvArray.arrayPowerW, 0) / 1_000_000, acPowerMW * num(systemScale.dcAcRatio, 1.2));
  const utilityActive = acPowerMW > 0.5 || systemScale.designMode === 'block_based_power_plant';
  const dcAcRatio = round(dcPowerMW / Math.max(0.001, acPowerMW), 3);
  const pf = clamp(num(settings.powerFactor ?? settings.pf, 0.98), 0.8, 1);
  const transformerEfficiency = clamp(num(settings.transformerEfficiency, 0.985), 0.94, 0.995);
  const mvVoltageKV = pickMvVoltageKV(acPowerMW, settings.mvVoltageKV);
  const blockStationMW = pickBlockStationMW(acPowerMW, settings.blockStationMW || num(systemScale.blockPowerMW, 0));
  const blockCount = utilityActive ? Math.max(num(systemScale.blockCount, 0), ceil(acPowerMW / Math.max(0.1, blockStationMW))) : 0;
  const actualBlockMW = utilityActive ? acPowerMW / Math.max(1, blockCount) : acPowerMW;
  const apparentPowerMVA = acPowerMW / Math.max(0.1, pf * transformerEfficiency);
  const transformerUnitMVA = utilityActive ? (actualBlockMW <= 0.75 ? 0.8 : actualBlockMW <= 1.25 ? 1.25 : actualBlockMW <= 2.5 ? 2.5 : 5) : 0;
  const transformerCount = utilityActive ? ceil(apparentPowerMVA / Math.max(0.1, transformerUnitMVA)) : 0;
  const transformerReservePercent = utilityActive ? round(((transformerCount * transformerUnitMVA - apparentPowerMVA) / Math.max(0.1, apparentPowerMVA)) * 100, 1) : 0;
  const feederCount = utilityActive ? Math.max(blockCount, ceil(acPowerMW / (mvVoltageKV >= 33 ? 6 : mvVoltageKV >= 20 ? 4 : 2))) : 0;
  const feederPowerMW = utilityActive ? acPowerMW / Math.max(1, feederCount) : 0;
  const feederCurrentA = utilityActive ? feederPowerMW * 1_000_000 / (Math.sqrt(3) * Math.max(0.4, mvVoltageKV) * 1000 * Math.max(0.1, pf)) : 0;
  const mvVoltageDropPercent = utilityActive ? round(clamp((num(settings.mvFeederLengthM, 600) / 1000) * feederCurrentA / (mvVoltageKV >= 20 ? 420 : 280), 0.2, 5.5), 2) : 0;
  const inverterRatedKW = Math.max(1, num(inverter.ratedPowerW, systemScale.inverterRatedPowerW || 30000) / 1000);
  const inverterPerBlock = utilityActive ? ceil((actualBlockMW * 1000) / inverterRatedKW) : num(inverterCount, 1);
  const totalUtilityInverters = utilityActive ? inverterPerBlock * blockCount : num(inverterCount, 1);
  const panelAreaM2 = num(pvArray.areaM2, 0);
  const groundCoverageRatio = clamp(num(settings.groundCoverageRatio, 0.42), 0.28, 0.62);
  const rowSpacingFactor = round(1 / Math.max(0.2, groundCoverageRatio), 2);
  const landAreaM2 = utilityActive ? Math.max(panelAreaM2 / Math.max(0.2, groundCoverageRatio), dcPowerMW * 10000) : panelAreaM2 * 1.25;
  const landAreaHa = round(landAreaM2 / 10000, 2);
  const psh = num(env.psh, 5.2);
  const effectiveEfficiency = clamp(num(env.effectiveEfficiency, 0.78), 0.5, 0.9);
  const performanceRatio = clamp(num(settings.performanceRatio, round(effectiveEfficiency * 0.94, 3)), 0.68, 0.88);
  const dailyYieldKWh = round(dcPowerMW * 1000 * psh * performanceRatio, 0);
  const annualYieldKWh = round(dailyYieldKWh * 365, 0);
  const specificYieldKWhPerKWp = round(annualYieldKWh / Math.max(1, dcPowerMW * 1000), 0);
  const cufPercent = round((annualYieldKWh / Math.max(1, acPowerMW * 1000 * 8760)) * 100, 2);
  const degradationYear1Percent = clamp(num(settings.degradationYear1Percent, 1), 0, 3);
  const annualYieldAfterDegradationKWh = round(annualYieldKWh * (1 - degradationYear1Percent / 100), 0);
  const interconnectionLevel = acPowerMW <= 0.5 ? 'LV' : acPowerMW <= 5 ? 'MV-11kV' : acPowerMW <= 25 ? 'MV-20kV' : 'MV-33kV/HV interface';
  const exportLimitMW = num(settings.exportLimitMW, acPowerMW);
  const exportCurtailmentRisk = exportLimitMW > 0 && exportLimitMW < acPowerMW;
  const clippingRisk = dcAcRatio > 1.4 ? 'high' : dcAcRatio > 1.25 ? 'medium' : dcAcRatio < 1.05 ? 'under-dc' : 'normal';

  const checks = [];
  const addCheck = (key, ok, level, message, recommendation = '', technical = '') => checks.push({ key, ok, level: ok ? 'ok' : level, message, recommendation, technical });
  if (utilityActive) {
    addCheck('dc-ac-ratio', dcAcRatio >= 1.05 && dcAcRatio <= 1.4, dcAcRatio > 1.5 ? 'error' : 'warning', `نسبت DC/AC برابر ${dcAcRatio} است.`, 'نسبت DC/AC نیروگاهی معمولاً باید با تحلیل اقلیم، clipping و محدودیت شبکه تنظیم شود.', `dcMW=${dcPowerMW}; acMW=${acPowerMW}`);
    addCheck('transformer-loading', transformerReservePercent >= 5, 'warning', `حاشیه ظرفیت ترانس ${transformerReservePercent}% است.`, 'توان یا تعداد ترانس بلوکی را طوری انتخاب کنید که حاشیه رزرو مثبت و قابل قبول بماند.', `mva=${apparentPowerMVA}; tr=${transformerCount}x${transformerUnitMVA}MVA`);
    addCheck('mv-feeder-current', feederCurrentA <= 260, feederCurrentA > 340 ? 'error' : 'warning', `جریان هر فیدر MV حدود ${round(feederCurrentA, 1)} آمپر است.`, 'تعداد فیدر، سطح ولتاژ MV یا توان هر بلوک را بازبینی کنید.', `feeders=${feederCount}; voltage=${mvVoltageKV}kV`);
    addCheck('mv-voltage-drop', mvVoltageDropPercent <= 3, mvVoltageDropPercent > 5 ? 'error' : 'warning', `افت ولتاژ تقریبی MV حدود ${mvVoltageDropPercent}% است.`, 'طول فیدر، مقطع کابل MV یا تعداد فیدرها باید اصلاح شود.', `drop=${mvVoltageDropPercent}%`);
    addCheck('land-area', landAreaHa > 0 && groundCoverageRatio >= 0.28 && groundCoverageRatio <= 0.62, 'warning', `زمین تقریبی ${landAreaHa} هکتار با GCR ${groundCoverageRatio} برآورد شد.`, 'برای طراحی نهایی، سایه ردیفی، شیب، جهت و مسیر دسترسی جداگانه کنترل شود.', `area=${landAreaM2}m2; gcr=${groundCoverageRatio}`);
    addCheck('grid-export', !exportCurtailmentRisk, 'warning', exportCurtailmentRisk ? `محدودیت تزریق ${exportLimitMW}MW کمتر از توان نیروگاه است.` : `محدودیت تزریق ${exportLimitMW}MW با توان نیروگاه سازگار است.`, 'در صورت محدودیت تزریق، سناریوی curtailment یا کاهش ظرفیت AC باید تحلیل شود.', `exportLimit=${exportLimitMW}; ac=${acPowerMW}`);
  }

  return {
    active: utilityActive,
    modeLabel: utilityActive ? 'Utility Electrical Design Layer' : 'Small/Commercial Electrical Layer',
    acPowerMW: round(acPowerMW, 3),
    dcPowerMW: round(dcPowerMW, 3),
    dcAcRatio,
    clippingRisk,
    mv: {
      voltageKV: mvVoltageKV,
      feederCount,
      feederPowerMW: round(feederPowerMW, 3),
      feederCurrentA: round(feederCurrentA, 1),
      voltageDropPercent: mvVoltageDropPercent,
      interconnectionLevel
    },
    transformer: {
      apparentPowerMVA: round(apparentPowerMVA, 3),
      unitMVA: transformerUnitMVA,
      count: transformerCount,
      reservePercent: transformerReservePercent,
      efficiency: transformerEfficiency,
      powerFactor: pf
    },
    blockStation: {
      blockCount,
      blockStationMW,
      actualBlockMW: round(actualBlockMW, 3),
      inverterPerBlock,
      totalUtilityInverters
    },
    land: {
      panelAreaM2: round(panelAreaM2, 1),
      groundCoverageRatio,
      rowSpacingFactor,
      landAreaM2: round(landAreaM2, 0),
      landAreaHa
    },
    yield: {
      performanceRatio,
      dailyKWh: dailyYieldKWh,
      annualKWh: annualYieldKWh,
      annualAfterDegradationKWh: annualYieldAfterDegradationKWh,
      specificYieldKWhPerKWp,
      cufPercent,
      monthly: buildMonthlyYield(annualYieldKWh, psh)
    },
    grid: {
      interconnectionLevel,
      exportLimitMW: round(exportLimitMW, 3),
      exportCurtailmentRisk,
      note: 'این خروجی فقط تحلیل مهندسی اتصال و ظرفیت است و شامل قیمت، خرید، فروش یا مراحل اداری نیست.'
    },
    checks,
    recommendations: [
      utilityActive ? 'برای پروژه‌های بالاتر از ۵۰۰kW، طراحی باید بر اساس بلوک اینورتر، ترانس بلوکی، فیدر MV و نقطه اتصال شبکه کنترل شود.' : 'پروژه در محدوده کوچک/تجاری است و لایه MV به صورت خلاصه نگه داشته می‌شود.',
      'نسبت DC/AC، جریان فیدر MV، حاشیه ترانس، GCR و محدودیت تزریق باید قبل از خروجی نهایی مهندسی تأیید شوند.',
      'SHIL در این بخش فقط تصمیم‌یار مهندسی است و هیچ پیشنهاد قیمت، فروش یا خرید ارائه نمی‌کند.'
    ]
  };
}
