function num(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  return Number.isFinite(n) ? n : fallback;
}
function round(value, digits = 2) { const f = 10 ** digits; return Math.round((Number(value) || 0) * f) / f; }
function clamp(v, min, max) { return Math.min(Math.max(Number(v) || 0, min), max); }
function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }

function inferRegion(city = '') {
  if (/اهواز|بندر|بوشهر|چابهار|کیش|قشم|هرمز/.test(city)) return 'hot_humid';
  if (/کرمان|یزد|زاهدان|قم|اصفهان|کاشان/.test(city)) return 'hot_dry';
  if (/رشت|ساری|گرگان|آمل|نوشهر/.test(city)) return 'humid_north';
  if (/تبریز|اردبیل|همدان|سنندج|ارومیه|زنجان/.test(city)) return 'cold_mountain';
  return 'temperate';
}

const REGION_FACTORS = {
  hot_humid: { dust: 0.95, humidity: 0.97, seasonal: 0.91, note: 'رطوبت و دمای بالا باعث کاهش راندمان عملیاتی می‌شود.' },
  hot_dry: { dust: 0.93, humidity: 0.99, seasonal: 0.94, note: 'گردوغبار و دمای بالا عامل اصلی افت تولید است.' },
  humid_north: { dust: 0.97, humidity: 0.95, seasonal: 0.86, note: 'رطوبت، ابرناکی و فصل بارندگی باید با ضریب احتیاط دیده شود.' },
  cold_mountain: { dust: 0.97, humidity: 0.99, seasonal: 0.92, note: 'دمای پایین برای توان خوب است، اما Voc زمستانی باید دقیق کنترل شود.' },
  temperate: { dust: 0.96, humidity: 0.98, seasonal: 0.92, note: 'ضرایب اقلیمی در محدوده استاندارد ایران در نظر گرفته شد.' },
};

function defaultMonthly(psh) {
  return Array.from({ length: 12 }, (_, index) => {
    const seasonalWave = 1 + Math.sin(((index + 1) - 3) / 12 * Math.PI * 2) * 0.16;
    return { month: index + 1, psh: round(clamp(psh * seasonalWave, psh * 0.62, psh * 1.22), 2) };
  });
}

export function buildClimateProductionForecast(input, climate, pv) {
  if (!climate?.applicable || !pv) return { applicable: false, monthly: [], annualProductionKwh: 0, dailyProductionKwh: 0 };
  const stored = parseJson(input.climateProductionForecastJson, null);
  if (stored?.annualProductionKwh) return { applicable: true, source: climate.source, ...stored };
  const days = [31,31,31,31,31,31,30,30,30,30,30,29];
  const installedKw = Number(pv.installedPvPowerW || 0) / 1000;
  const pr = Number(pv.performanceRatio || climate.climateDerateFactor || 0.78);
  const monthly = (climate.monthly || defaultMonthly(climate.correctedPsh || climate.psh || 5)).map((item, index) => {
    const productionKwh = installedKw * Number(item.psh || 0) * pr * days[index];
    return { month: item.month || index + 1, psh: round(item.psh || 0, 2), productionKwh: round(productionKwh, 1) };
  });
  const annualProductionKwh = round(monthly.reduce((sum, item) => sum + item.productionKwh, 0), 1);
  return {
    applicable: true,
    source: climate.source,
    provider: climate.provider,
    dailyProductionKwh: round(annualProductionKwh / 365, 2),
    annualProductionKwh,
    monthly,
    worstMonth: monthly.reduce((min, m) => m.productionKwh < min.productionKwh ? m : min, monthly[0]),
    bestMonth: monthly.reduce((max, m) => m.productionKwh > max.productionKwh ? m : max, monthly[0]),
  };
}

export function calculateClimateIntelligence(input, shadowAnalysis) {
  if (input.systemType === 'backup') {
    return { applicable: false, source: 'not_applicable_for_backup', psh: 0, climateDerateFactor: 1, message: 'در برق اضطراری، PSH و تابش در محاسبات دخالت ندارد.' };
  }
  const region = inferRegion(input.city || '');
  const factors = REGION_FACTORS[region] || REGION_FACTORS.temperate;
  const hasOnlinePsh = num(input.realPsh, 0) > 0;
  const psh = hasOnlinePsh ? num(input.realPsh, 5.2) : num(input.sunHours, 5.2);
  const avgTemp = Number.isFinite(Number(input.realAverageTemperature)) ? num(input.realAverageTemperature, 30) : num(input.averageTemperature, 30);
  const maxTemp = Number.isFinite(Number(input.realMaxTemperature)) ? num(input.realMaxTemperature, 40) : num(input.maxTemperature, 40);
  const minTemp = Number.isFinite(Number(input.realMinTemperature)) ? num(input.realMinTemperature, 0) : num(input.minTemperature, 0);
  const tempDerate = num(input.autoTemperatureFactor, 0) || clamp(1 - Math.max(avgTemp - 25, 0) * 0.004 - Math.max(maxTemp - 45, 0) * 0.002, 0.78, 1.04);
  const altitudeBoost = num(input.altitude, 0) > 1500 ? 1.015 : 1;
  const shadowFactor = shadowAnalysis?.effectiveShadingFactor ?? num(input.shadingFactor, 0.95);
  const dustFactor = num(input.autoDustFactor, 0) || factors.dust;
  const humidityFactor = factors.humidity;
  const seasonalFactor = num(input.autoSeasonalFactor, 0) || factors.seasonal;
  const irradianceFactor = num(input.autoIrradianceFactor, 0) || 1;
  const climateDerateFactor = clamp(dustFactor * humidityFactor * seasonalFactor * tempDerate * altitudeBoost * shadowFactor * irradianceFactor, 0.45, 1.08);
  const correctedPsh = psh * climateDerateFactor;
  const onlineMonthly = parseJson(input.climateMonthlyPshJson, null);
  const monthly = Array.isArray(onlineMonthly) && onlineMonthly.length === 12 ? onlineMonthly.map((item, index) => ({ month: item.month || index + 1, psh: round(item.psh ?? item.value ?? psh, 2) })) : defaultMonthly(psh);
  const source = hasOnlinePsh ? (input.climateDataSource || input.climateProvider || 'online_climate_api') : (input.climateDataSource || 'offline_iran_climate_cache');
  return {
    applicable: true,
    source,
    provider: input.climateProvider || source,
    onlineReady: true,
    onlineStatus: input.climateOnlineStatus || (hasOnlinePsh ? 'online_success' : 'offline_cache'),
    fetchedAt: input.climateFetchedAt || null,
    fallbackReason: input.climateFallbackReason || '',
    region,
    psh: round(psh, 2),
    correctedPsh: round(correctedPsh, 2),
    realIrradianceKwhM2Day: round(input.realIrradianceKwhM2Day || psh, 2),
    clearSkyIrradianceKwhM2Day: round(input.clearSkyIrradianceKwhM2Day || 0, 2),
    averageTemperature: round(avgTemp, 1),
    minTemperature: round(minTemp, 1),
    maxTemperature: round(maxTemp, 1),
    climateDerateFactor: round(climateDerateFactor, 3),
    tempDerateFactor: round(tempDerate, 3),
    dustFactor,
    humidityFactor,
    seasonalFactor,
    irradianceFactor,
    environmentalAutoFactor: round(input.environmentalAutoFactor || climateDerateFactor, 3),
    worstMonth: monthly.reduce((min, m) => m.psh < min.psh ? m : min, monthly[0]),
    bestMonth: monthly.reduce((max, m) => m.psh > max.psh ? m : max, monthly[0]),
    monthly,
    message: hasOnlinePsh ? 'داده اقلیمی آنلاین/واقعی دریافت و روی موتور مهندسی قابل اعمال شد.' : factors.note,
  };
}
