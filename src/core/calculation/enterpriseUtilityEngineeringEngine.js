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

const MONTHS_FA = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function addCheck(checks, key, ok, level, message, recommendation = '', technical = '', scoreImpact = 0) {
  checks.push({ key, ok, level: ok ? 'ok' : level, message, recommendation, technical, scoreImpact });
}

function selectProtectionLevel(acPowerMW, mvVoltageKV) {
  if (acPowerMW >= 20 || mvVoltageKV >= 33) return 'utility-hv-interface';
  if (acPowerMW >= 5) return 'utility-mv-selective';
  if (acPowerMW >= 0.5) return 'industrial-mv-basic';
  return 'lv-commercial';
}

function buildProtectionLayer({ utilityElectrical = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const acPowerMW = num(utilityElectrical.acPowerMW, 0);
  const mvVoltageKV = num(utilityElectrical.mv?.voltageKV, 0.4);
  const feederCurrentA = num(utilityElectrical.mv?.feederCurrentA, 0);
  const transformerMVA = num(utilityElectrical.transformer?.unitMVA, 0);
  const transformerCount = num(utilityElectrical.transformer?.count, 0);
  const protectionLevel = selectProtectionLevel(acPowerMW, mvVoltageKV);
  const lvCurrentA = transformerMVA > 0 ? (transformerMVA * 1_000_000) / (Math.sqrt(3) * 400) : 0;
  const estimatedMvFaultKA = clamp(num(settings.estimatedMvFaultKA, acPowerMW >= 20 ? 25 : acPowerMW >= 5 ? 20 : 16), 10, 40);
  const requiredBreakerKA = estimatedMvFaultKA <= 16 ? 16 : estimatedMvFaultKA <= 20 ? 20 : estimatedMvFaultKA <= 25 ? 25 : 31.5;
  const feederBreakerA = feederCurrentA <= 160 ? 200 : feederCurrentA <= 250 ? 315 : feederCurrentA <= 400 ? 630 : 800;
  const transformerProtection = transformerMVA >= 2.5 ? 'حفاظت دیفرانسیل ترانس + اضافه‌جریان + ارت فالت' : 'اضافه‌جریان + ارت فالت + دمای ترانس';
  const checks = [];
  if (active) {
    addCheck(checks, 'mv-breaker-fault-level', requiredBreakerKA >= estimatedMvFaultKA, 'error', `سطح قطع کلید MV باید حداقل ${requiredBreakerKA}kA باشد.`, 'سطح اتصال کوتاه نقطه اتصال و ریتینگ کلید/RMU باید با هم کنترل شوند.', `fault=${estimatedMvFaultKA}kA; breaker=${requiredBreakerKA}kA`, 10);
    addCheck(checks, 'feeder-breaker-current', feederBreakerA >= feederCurrentA * 1.15, feederCurrentA > 650 ? 'error' : 'warning', `کلید فیدر حدود ${feederBreakerA}A برای جریان ${round(feederCurrentA, 1)}A پیشنهاد شد.`, 'در صورت نزدیک بودن جریان فیدر به ریتینگ، تعداد فیدر یا سطح ولتاژ MV افزایش یابد.', `feederCurrent=${feederCurrentA}; breaker=${feederBreakerA}`, 8);
    addCheck(checks, 'transformer-protection', transformerCount > 0, 'error', `برای ${transformerCount} ترانس، حفاظت ${transformerProtection} لازم است.`, 'منطق حفاظت هر ترانس بلوکی از فیدر MV و خروجی LV مستقل شود.', `tr=${transformerCount}x${transformerMVA}MVA`, 8);
    addCheck(checks, 'anti-islanding', true, 'warning', 'حفاظت Anti-Islanding باید برای اتصال شبکه فعال باشد.', 'تنظیمات حفاظت اتصال شبکه باید مطابق الزامات بهره‌بردار شبکه بررسی شود.', 'anti-islanding-required', 0);
  }
  return {
    active,
    protectionLevel,
    estimatedMvFaultKA,
    requiredBreakerKA,
    feederBreakerA,
    lvMainCurrentA: round(lvCurrentA, 1),
    transformerProtection,
    requiredFunctions: active ? ['Over Current 50/51', 'Earth Fault 50N/51N', 'Under/Over Voltage 27/59', 'Under/Over Frequency 81U/81O', 'Reverse Power 32', 'Anti-Islanding', transformerMVA >= 2.5 ? 'Transformer Differential 87T' : 'Transformer Thermal 49'] : [],
    notes: active ? [
      'این خروجی انتخاب تجهیز تجاری نیست؛ فقط الزامات مهندسی حفاظت را برای کنترل طراحی مشخص می‌کند.',
      'هماهنگی حفاظتی نهایی باید با سطح اتصال کوتاه، منحنی رله‌ها و الزامات شبکه انجام شود.'
    ] : [],
    checks
  };
}

function buildGridStudyLayer({ utilityElectrical = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const acPowerMW = num(utilityElectrical.acPowerMW, 0);
  const exportLimitMW = num(utilityElectrical.grid?.exportLimitMW, acPowerMW);
  const pf = clamp(num(utilityElectrical.transformer?.powerFactor, 0.98), 0.8, 1);
  const mvVoltageKV = num(utilityElectrical.mv?.voltageKV, 0.4);
  const shortCircuitMVA = num(settings.gridShortCircuitMVA, acPowerMW >= 20 ? 500 : acPowerMW >= 5 ? 250 : 100);
  const gridStrengthRatio = shortCircuitMVA / Math.max(0.1, acPowerMW);
  const reactivePowerMVAr = round(acPowerMW * Math.tan(Math.acos(pf)), 3);
  const exportUtilizationPercent = round((acPowerMW / Math.max(0.001, exportLimitMW)) * 100, 1);
  const voltageRisePercent = round(clamp((acPowerMW / Math.max(1, shortCircuitMVA)) * 100 * 1.8, 0.05, 8), 2);
  const harmonicRisk = acPowerMW >= 20 || gridStrengthRatio < 20 ? 'high' : acPowerMW >= 5 || gridStrengthRatio < 40 ? 'medium' : 'low';
  const checks = [];
  if (active) {
    addCheck(checks, 'grid-strength', gridStrengthRatio >= 20, gridStrengthRatio < 10 ? 'error' : 'warning', `نسبت قدرت شبکه حدود ${round(gridStrengthRatio, 1)} است.`, 'اگر شبکه ضعیف باشد، کنترل ولتاژ، محدودیت تزریق، فیلتر هارمونیک یا مطالعه Load Flow لازم می‌شود.', `SCR=${gridStrengthRatio}; Scc=${shortCircuitMVA}MVA`, 12);
    addCheck(checks, 'export-limit', exportLimitMW >= acPowerMW, 'warning', `محدودیت تزریق ${exportLimitMW}MW و توان AC ${acPowerMW}MW است.`, 'در صورت محدودیت تزریق، کنترل توان اکتیو و سناریوی Curtailment فعال شود.', `exportUtilization=${exportUtilizationPercent}%`, 8);
    addCheck(checks, 'voltage-rise', voltageRisePercent <= 3, voltageRisePercent > 5 ? 'error' : 'warning', `افزایش ولتاژ تقریبی در PCC حدود ${voltageRisePercent}% است.`, 'سطح ولتاژ اتصال، تعداد فیدر و کنترل Q/V بازبینی شود.', `Vrise=${voltageRisePercent}%`, 10);
    addCheck(checks, 'reactive-power', pf >= 0.95, 'warning', `توان راکتیو تقریبی ${reactivePowerMVAr}MVAr است.`, 'کنترل ضریب توان و قابلیت Q اینورتر در نقطه اتصال کنترل شود.', `PF=${pf}; Q=${reactivePowerMVAr}MVAr`, 6);
  }
  return {
    active,
    studyLevel: active ? (acPowerMW >= 20 ? 'Load Flow + Short Circuit + Harmonics + Protection Coordination' : acPowerMW >= 5 ? 'Load Flow + Short Circuit + Basic Harmonics' : 'Connection Capacity Check') : 'not-required',
    pointOfConnection: mvVoltageKV >= 33 ? 'PCC در مرز MV-33kV/HV' : mvVoltageKV >= 20 ? 'PCC در شبکه 20kV' : mvVoltageKV >= 11 ? 'PCC در شبکه 11kV' : 'LV/PCC محلی',
    shortCircuitMVA,
    gridStrengthRatio: round(gridStrengthRatio, 1),
    voltageRisePercent,
    reactivePowerMVAr,
    harmonicRisk,
    exportUtilizationPercent,
    checks,
    notes: active ? [
      'این بخش مطالعه شبکه کامل را جایگزین نمی‌کند؛ خروجی آن کنترل مهندسی اولیه برای تصمیم‌گیری طراحی است.',
      'برای اتصال نهایی، Load Flow، اتصال کوتاه، هارمونیک و پایداری باید با داده واقعی شبکه انجام شود.'
    ] : []
  };
}

function buildTrackerLayer({ utilityElectrical = {}, env = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const trackerMode = settings.trackerMode || (num(utilityElectrical.acPowerMW, 0) >= 5 ? 'single_axis' : 'fixed_tilt');
  const tiltDeg = clamp(num(settings.tiltDeg, trackerMode === 'fixed_tilt' ? 28 : 0), 0, 45);
  const terrainSlopeDeg = clamp(num(settings.terrainSlopeDeg, 2), 0, 18);
  const gcr = clamp(num(utilityElectrical.land?.groundCoverageRatio, settings.groundCoverageRatio || 0.42), 0.24, 0.62);
  const backtracking = trackerMode === 'single_axis';
  const trackerGainPercent = trackerMode === 'single_axis' ? clamp(num(settings.trackerGainPercent, 16), 8, 28) : 0;
  const shadingLossPercent = trackerMode === 'single_axis' ? clamp((gcr - 0.36) * 28 + terrainSlopeDeg * 0.35, 0, 8) : clamp((gcr - 0.42) * 18 + terrainSlopeDeg * 0.25, 0, 10);
  const correctedAnnualKWh = round(num(utilityElectrical.yield?.annualKWh, 0) * (1 + trackerGainPercent / 100) * (1 - shadingLossPercent / 100), 0);
  const checks = [];
  if (active) {
    addCheck(checks, 'tracker-gcr', trackerMode !== 'single_axis' || gcr <= 0.48, 'warning', `GCR برابر ${gcr} برای حالت ${trackerMode} است.`, 'برای ترکِر تک‌محوره، GCR بالا می‌تواند باعث سایه و نیاز به Backtracking شدید شود.', `gcr=${gcr}; mode=${trackerMode}`, 7);
    addCheck(checks, 'terrain-slope', terrainSlopeDeg <= 8, terrainSlopeDeg > 12 ? 'error' : 'warning', `شیب زمین ${terrainSlopeDeg} درجه برآورد شد.`, 'شیب زمین در چیدمان ردیف، زهکشی، سازه و دسترسی نگهداری اثرگذار است.', `slope=${terrainSlopeDeg}`, 8);
    addCheck(checks, 'shading-loss', shadingLossPercent <= 5, 'warning', `تلفات سایه ردیفی/توپوگرافی حدود ${round(shadingLossPercent, 2)}% است.`, 'فاصله ردیف‌ها، GCR، Tilt و Backtracking بازبینی شود.', `shade=${shadingLossPercent}%`, 6);
  }
  return {
    active,
    trackerMode,
    tiltDeg,
    terrainSlopeDeg,
    backtracking,
    trackerGainPercent,
    rowShadingLossPercent: round(shadingLossPercent, 2),
    correctedAnnualKWh,
    notes: active ? ['Tracker/GCR فقط تحلیل مهندسی چیدمان و انرژی است و وارد خرید یا قیمت نمی‌شود.'] : [],
    checks
  };
}

function buildTerrainGisLayer({ utilityElectrical = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const landHa = num(utilityElectrical.land?.landAreaHa, 0);
  const terrainSlopeDeg = clamp(num(settings.terrainSlopeDeg, 2), 0, 18);
  const usableLandPercent = clamp(num(settings.usableLandPercent, terrainSlopeDeg > 8 ? 72 : 82), 55, 92);
  const accessRoadPercent = clamp(num(settings.accessRoadPercent, landHa >= 20 ? 7 : 5), 3, 12);
  const setbackPercent = clamp(num(settings.setbackPercent, 4), 2, 10);
  const drainageRisk = terrainSlopeDeg > 10 ? 'high' : terrainSlopeDeg > 5 ? 'medium' : 'low';
  const requiredGrossLandHa = round(landHa / Math.max(0.35, (usableLandPercent - accessRoadPercent - setbackPercent) / 100), 2);
  const checks = [];
  if (active) {
    addCheck(checks, 'usable-land', usableLandPercent >= 70, 'warning', `درصد زمین قابل استفاده ${usableLandPercent}% فرض شد.`, 'در زمین‌های نامنظم یا شیب‌دار، ظرفیت نصب باید با محدودیت مسیر، زهکشی و حریم اصلاح شود.', `usable=${usableLandPercent}%`, 8);
    addCheck(checks, 'gross-land', requiredGrossLandHa <= landHa * 1.6 || landHa === 0, 'warning', `زمین ناخالص موردنیاز حدود ${requiredGrossLandHa} هکتار است.`, 'برای خروجی نهایی، حریم‌ها، راه دسترسی، اتاقک‌ها و ترانشه کابل در نقشه جانمایی وارد شود.', `gross=${requiredGrossLandHa}; net=${landHa}`, 6);
    addCheck(checks, 'drainage-risk', drainageRisk !== 'high', 'warning', `ریسک زهکشی/توپوگرافی ${drainageRisk} است.`, 'مسیر آب‌های سطحی و خاکبرداری/تسطیح در طراحی اجرایی کنترل شود.', `drainage=${drainageRisk}`, 6);
  }
  return {
    active,
    landNetHa: round(landHa, 2),
    requiredGrossLandHa,
    usableLandPercent,
    accessRoadPercent,
    setbackPercent,
    drainageRisk,
    terrainSlopeDeg,
    notes: active ? ['GIS/Terrain در این نسخه کنترل اولیه مهندسی زمین است؛ نقشه‌برداری و مدل ارتفاعی واقعی جایگزین آن نمی‌شود.'] : [],
    checks
  };
}

function buildScadaLayer({ utilityElectrical = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const blockCount = num(utilityElectrical.blockStation?.blockCount, 0);
  const feederCount = num(utilityElectrical.mv?.feederCount, 0);
  const inverterCount = num(utilityElectrical.blockStation?.totalUtilityInverters, 0);
  const weatherStationCount = active ? Math.max(1, ceil(num(utilityElectrical.acPowerMW, 0) / 10)) : 0;
  const dataLoggerCount = active ? Math.max(blockCount, ceil(inverterCount / 20)) : 0;
  const communicationTopology = num(utilityElectrical.acPowerMW, 0) >= 10 ? 'fiber-ring-with-block-gateways' : 'hybrid-fiber-rs485';
  const checks = [];
  if (active) {
    addCheck(checks, 'scada-coverage', dataLoggerCount >= blockCount, 'warning', `برای ${blockCount} بلوک، ${dataLoggerCount} دیتالاگر/گیت‌وی منطقی است.`, 'هر بلوک نیروگاهی باید پایش اینورتر، ترانس، فیدر، هواشناسی و کنتور را پوشش دهد.', `loggers=${dataLoggerCount}; blocks=${blockCount}`, 5);
    addCheck(checks, 'metering', feederCount > 0, 'warning', `برای ${feederCount} فیدر، پایش انرژی و وضعیت بریکر لازم است.`, 'کنتور مرجع PCC، پایش فیدر و ثبت رخداد حفاظتی در توپولوژی SCADA لحاظ شود.', `feeders=${feederCount}`, 5);
  }
  return {
    active,
    communicationTopology,
    blockGatewayCount: dataLoggerCount,
    weatherStationCount,
    monitoredPoints: active ? ['Inverter telemetry', 'Block transformer status', 'MV feeder breaker status', 'PCC meter', 'Weather station', 'Protection relay events', 'Curtailment command'] : [],
    notes: active ? ['SCADA در SHIL فقط معماری پایش و کنترل مهندسی را مشخص می‌کند، نه برند یا خرید تجهیز.'] : [],
    checks
  };
}

function buildAdvancedYieldLayer({ utilityElectrical = {}, tracker = {}, env = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active);
  const baseAnnual = num(utilityElectrical.yield?.annualKWh, 0);
  const trackerAnnual = num(tracker.correctedAnnualKWh, baseAnnual);
  const availability = clamp(num(settings.plantAvailabilityPercent, 98), 92, 99.8) / 100;
  const degradationAnnualPercent = clamp(num(settings.annualDegradationPercent, 0.55), 0.2, 1.2);
  const firstYear = round(trackerAnnual * availability, 0);
  const years = Array.from({ length: 25 }, (_, index) => ({
    year: index + 1,
    yieldKWh: round(firstYear * Math.pow(1 - degradationAnnualPercent / 100, index), 0)
  }));
  const lifeCycleYieldMWh = round(years.reduce((sum, item) => sum + item.yieldKWh, 0) / 1000, 0);
  const monthly = (utilityElectrical.yield?.monthly || []).map((item) => ({
    ...item,
    correctedYieldKWh: round(num(item.yieldKWh, 0) * (firstYear / Math.max(1, baseAnnual)), 0)
  }));
  const p50KWh = firstYear;
  const p90KWh = round(firstYear * 0.9, 0);
  const checks = [];
  if (active) {
    addCheck(checks, 'availability', availability >= 0.96, 'warning', `دسترسی‌پذیری نیروگاه ${round(availability * 100, 1)}% فرض شد.`, 'برای نیروگاه بزرگ، توقف اینورتر/فیدر و تعمیرات باید در شبیه‌سازی سالانه لحاظ شود.', `availability=${availability}`, 5);
    addCheck(checks, 'p90-gap', p90KWh > 0, 'warning', `تولید P90 سال اول حدود ${p90KWh} kWh برآورد شد.`, 'P50/P90 باید با داده اقلیمی ساعتی و عدم‌قطعیت‌ها در طراحی نهایی بازبینی شود.', `P50=${p50KWh}; P90=${p90KWh}`, 4);
  }
  return {
    active,
    availabilityPercent: round(availability * 100, 1),
    annualDegradationPercent: degradationAnnualPercent,
    firstYearKWh: firstYear,
    p50KWh,
    p90KWh,
    lifeCycleYieldMWh,
    monthly,
    years,
    checks,
    notes: active ? ['شبیه‌سازی تولید پیشرفته در این نسخه برآورد مهندسی است و جایگزین دیتاست ساعتی واقعی/PVsyst نمی‌شود.'] : []
  };
}

export function runEnterpriseUtilityEngineeringEngine({ utilityElectrical = {}, systemScale = {}, env = {}, settings = {} } = {}) {
  const active = Boolean(utilityElectrical.active) || systemScale?.designMode === 'block_based_power_plant';
  const protection = buildProtectionLayer({ utilityElectrical, settings });
  const gridStudy = buildGridStudyLayer({ utilityElectrical, settings });
  const tracker = buildTrackerLayer({ utilityElectrical, env, settings });
  const terrain = buildTerrainGisLayer({ utilityElectrical, settings });
  const scada = buildScadaLayer({ utilityElectrical, settings });
  const advancedYield = buildAdvancedYieldLayer({ utilityElectrical, tracker, env, settings });
  const checks = [
    ...protection.checks,
    ...gridStudy.checks,
    ...tracker.checks,
    ...terrain.checks,
    ...scada.checks,
    ...advancedYield.checks
  ];
  const penalty = checks.filter((item) => !item.ok).reduce((sum, item) => sum + num(item.scoreImpact, item.level === 'error' ? 10 : 5), 0);
  const score = active ? clamp(100 - penalty, 25, 100) : 100;
  const status = score < 60 || checks.some((item) => !item.ok && item.level === 'error') ? 'error' : score < 82 || checks.some((item) => !item.ok && item.level === 'warning') ? 'warning' : 'ok';
  return {
    active,
    status,
    score: round(score, 0),
    label: active ? 'Enterprise Utility Engineering Layer' : 'Small System Engineering Layer',
    protection,
    gridStudy,
    tracker,
    terrain,
    scada,
    advancedYield,
    checks,
    recommendations: active ? [
      'برای ۵ تا ۳۰ مگاوات، خروجی باید هم‌زمان از نظر MV، ترانس، حفاظت، اتصال شبکه، زمین، تولید سالانه و SCADA کنترل شود.',
      'هر هشدار این لایه فقط اصلاح مهندسی پیشنهاد می‌دهد و به قیمت، خرید، فروش یا برند تجهیزات وارد نمی‌شود.',
      'برای طراحی اجرایی نهایی، داده واقعی شبکه، نقشه زمین، مسیر کابل و الزامات بهره‌بردار باید وارد مدل شود.'
    ] : []
  };
}
