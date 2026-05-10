function toIsoDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;
}

function sum(values) {
  return values.map(Number).filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function byMonth(parameter = {}) {
  const buckets = Array.from({ length: 12 }, () => []);
  Object.entries(parameter).forEach(([key, value]) => {
    const month = Number(String(key).slice(4, 6));
    if (month >= 1 && month <= 12 && Number.isFinite(Number(value))) buckets[month - 1].push(Number(value));
  });
  return buckets.map((items, index) => ({ month: index + 1, value: items.length ? average(items) : 0 }));
}

function normalizeMonthlyPsh(monthly, fallbackPsh = 5) {
  return monthly.map((item) => ({
    month: item.month,
    psh: Number((item.value || fallbackPsh).toFixed(2)),
  }));
}

function estimateEnvironmentalFactors({ psh, avgTemp, maxTemp, irradiance }) {
  const tempFactor = Math.max(0.78, Math.min(1.03, 1 - Math.max(avgTemp - 25, 0) * 0.004 - Math.max(maxTemp - 45, 0) * 0.002));
  const irradianceFactor = Math.max(0.82, Math.min(1.04, irradiance / Math.max(psh || 5, 1)));
  const dustFactor = psh >= 5.8 && avgTemp >= 30 ? 0.93 : psh >= 5.2 ? 0.95 : 0.97;
  const seasonalFactor = psh >= 5 ? 0.94 : 0.9;
  return {
    autoTemperatureFactor: Number(tempFactor.toFixed(3)),
    autoIrradianceFactor: Number(irradianceFactor.toFixed(3)),
    autoDustFactor: Number(dustFactor.toFixed(3)),
    autoSeasonalFactor: Number(seasonalFactor.toFixed(3)),
    environmentalAutoFactor: Number((tempFactor * irradianceFactor * dustFactor * seasonalFactor).toFixed(3)),
  };
}

function productionForecast({ installedPvKw = 1, monthlyPsh = [], performanceRatio = 0.78 }) {
  const days = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  const monthly = monthlyPsh.map((item, index) => {
    const kwh = installedPvKw * (item.psh || 0) * performanceRatio * days[index];
    return { month: item.month, psh: item.psh, productionKwh: Number(kwh.toFixed(1)) };
  });
  const annual = sum(monthly.map((item) => item.productionKwh));
  const daily = annual / 365;
  return {
    dailyProductionKwh: Number(daily.toFixed(2)),
    annualProductionKwh: Number(annual.toFixed(1)),
    monthly,
    worstMonth: monthly.reduce((min, item) => item.productionKwh < min.productionKwh ? item : min, monthly[0] || { month: null, productionKwh: 0 }),
    bestMonth: monthly.reduce((max, item) => item.productionKwh > max.productionKwh ? item : max, monthly[0] || { month: null, productionKwh: 0 }),
  };
}

export async function fetchNasaPowerClimate({ latitude, longitude, installedPvKw = 1 }) {
  const end = new Date();
  end.setDate(end.getDate() - 5);
  const start = new Date(end);
  start.setDate(start.getDate() - 365);
  const params = new URLSearchParams({
    parameters: 'ALLSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,CLRSKY_SFC_SW_DWN',
    community: 'RE',
    longitude: String(longitude),
    latitude: String(latitude),
    start: toIsoDate(start),
    end: toIsoDate(end),
    format: 'JSON',
  });
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NASA POWER ${response.status}`);
  const data = await response.json();
  const p = data?.properties?.parameter || {};
  const psh = average(Object.values(p.ALLSKY_SFC_SW_DWN || {}));
  const clearSky = average(Object.values(p.CLRSKY_SFC_SW_DWN || {}));
  const avgTemp = average(Object.values(p.T2M || {}));
  const maxTemp = average(Object.values(p.T2M_MAX || {}));
  const minTemp = average(Object.values(p.T2M_MIN || {}));
  const monthlyPsh = normalizeMonthlyPsh(byMonth(p.ALLSKY_SFC_SW_DWN || {}), psh || 5);
  const factors = estimateEnvironmentalFactors({ psh, avgTemp, maxTemp, irradiance: clearSky || psh });
  return {
    provider: 'NASA POWER',
    source: 'nasa_power_online',
    fetchedAt: new Date().toISOString(),
    latitude,
    longitude,
    realPsh: Number((psh || 0).toFixed(2)),
    realIrradianceKwhM2Day: Number((psh || 0).toFixed(2)),
    clearSkyIrradianceKwhM2Day: Number((clearSky || 0).toFixed(2)),
    realAverageTemperature: Number((avgTemp || 0).toFixed(1)),
    realMaxTemperature: Number((maxTemp || 0).toFixed(1)),
    realMinTemperature: Number((minTemp || 0).toFixed(1)),
    monthlyPsh,
    ...factors,
    productionForecast: productionForecast({ installedPvKw, monthlyPsh, performanceRatio: factors.environmentalAutoFactor || 0.78 }),
    rawStatus: 'online_success',
  };
}

export async function fetchSolcastForecast({ latitude, longitude, installedPvKw = 1, apiKey }) {
  if (!apiKey) throw new Error('Solcast API key is not configured.');
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hours: '168',
    period: 'PT60M',
    output_parameters: 'pv_power_rooftop',
    capacity: String(installedPvKw || 1),
    format: 'json',
    api_key: apiKey,
  });
  const url = `https://api.solcast.com.au/data/forecast/rooftop_pv_power?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Solcast ${response.status}`);
  const data = await response.json();
  const rows = data?.forecasts || data?.estimated_actuals || [];
  const totalKwh = sum(rows.map((item) => Number(item.pv_power_rooftop || item.pv_power || 0)));
  const days = Math.max(1, rows.length / 24);
  const daily = totalKwh / days;
  return {
    provider: 'Solcast',
    source: 'solcast_online_forecast',
    fetchedAt: new Date().toISOString(),
    latitude,
    longitude,
    realPsh: Number((daily / Math.max(installedPvKw || 1, 0.1)).toFixed(2)),
    realIrradianceKwhM2Day: Number((daily / Math.max(installedPvKw || 1, 0.1)).toFixed(2)),
    productionForecast: {
      dailyProductionKwh: Number(daily.toFixed(2)),
      annualProductionKwh: Number((daily * 365).toFixed(1)),
      monthly: [],
      worstMonth: { month: null, productionKwh: 0 },
      bestMonth: { month: null, productionKwh: 0 },
    },
    rawStatus: 'online_success',
  };
}

export async function fetchOnlineClimateIntelligence(options) {
  const source = options.source || 'nasa_power_online';
  if (source === 'solcast_online_forecast') {
    try {
      return await fetchSolcastForecast(options);
    } catch (error) {
      const nasa = await fetchNasaPowerClimate(options);
      return { ...nasa, provider: 'NASA POWER', source: 'nasa_power_online_fallback', fallbackReason: error.message };
    }
  }
  return fetchNasaPowerClimate(options);
}
