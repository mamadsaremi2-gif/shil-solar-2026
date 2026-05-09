function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const MONTH_FACTORS = [0.72, 0.79, 0.9, 1.02, 1.08, 1.12, 1.1, 1.03, 0.94, 0.84, 0.75, 0.69];
const MONTH_LABELS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

function normalizeSeries(values, targetTotal) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total || !targetTotal) return values.map(() => 0);
  return values.map((value) => (value / total) * targetTotal);
}

function buildHourlyLoadProfile(input, loads) {
  if (input.calculationMode === "load_profile" && loads.normalizedProfile?.length === 24) {
    return loads.normalizedProfile.map((slot) => slot.energyWh);
  }

  if (input.calculationMode === "loads" && loads.normalizedLoads?.length) {
    const hourly = Array(24).fill(0);
    loads.normalizedLoads.forEach((item) => {
      const duration = Math.max(1, Math.min(24, Math.round(item.hours)));
      let startHour = 8;
      if (item.loadType === "motor") startHour = 10;
      if (item.loadType === "switching") startHour = 18;
      if (item.name?.includes("روشنایی")) startHour = 18;
      for (let i = 0; i < duration; i += 1) {
        hourly[(startHour + i) % 24] += item.demandPowerW;
      }
    });
    const total = hourly.reduce((sum, value) => sum + value, 0);
    if (total > 0) return normalizeSeries(hourly, loads.totalDailyEnergyWh);
  }

  const fallback = [0.48,0.42,0.4,0.38,0.4,0.48,0.62,0.78,0.82,0.76,0.66,0.58,0.54,0.52,0.5,0.54,0.68,0.92,1,0.96,0.88,0.74,0.6,0.52];
  return normalizeSeries(fallback, loads.totalDailyEnergyWh);
}

function buildHourlyPvProfile(pv, input) {
  if (!pv || input.systemType === "backup") return Array(24).fill(0);
  const sunrise = 6;
  const sunset = 18;
  const span = sunset - sunrise;
  const raw = Array.from({ length: 24 }, (_, hour) => {
    if (hour < sunrise || hour > sunset) return 0;
    const x = (hour - sunrise) / span;
    const base = Math.sin(Math.PI * x);
    const tempPenalty = input.maxTemperature > 38 && hour >= 12 && hour <= 15 ? 0.92 : 1;
    return Math.max(base, 0) * tempPenalty;
  });
  return normalizeSeries(raw, pv.estimatedDailyProductionWh);
}

export function simulateSystem(input, loads, battery, pv) {
  const loadSeries = buildHourlyLoadProfile(input, loads);
  const pvSeries = buildHourlyPvProfile(pv, input);

  const batteryCapacityWh = Math.max(battery?.usableBatteryWh ?? 0, 0);
  const initialSoc = input.systemType === "backup" ? 1 : input.systemType === "hybrid" ? 0.65 : 0.85;
  const minSoc = Math.max(0.05, 1 - input.dod);

  let soc = batteryCapacityWh * initialSoc;
  let minSocSeen = soc;
  let maxSocSeen = soc;
  let unservedLoadWh = 0;
  let surplusEnergyWh = 0;
  let totalLoadServedWh = 0;
  let deficitHours = 0;
  let surplusHours = 0;
  let gridImportWh = 0;
  let gridExportWh = 0;

  const socPercent = [];
  const deficitWh = [];
  const surplusWh = [];
  const gridImportSeries = [];
  const gridExportSeries = [];

  loadSeries.forEach((loadWh, index) => {
    const pvWh = pvSeries[index] || 0;
    let net = pvWh - loadWh;
    let hourDeficit = 0;
    let hourSurplus = 0;
    let hourGridImport = 0;
    let hourGridExport = 0;

    if (batteryCapacityWh > 0) {
      if (net >= 0) {
        const room = batteryCapacityWh - soc;
        const charge = Math.min(net * input.controllerEfficiency, room);
        soc += charge;
        hourSurplus = Math.max(net - charge, 0);
      } else {
        const available = Math.max(soc - batteryCapacityWh * minSoc, 0);
        const discharge = Math.min(Math.abs(net) / input.inverterEfficiency, available);
        soc -= discharge;
        const served = discharge * input.inverterEfficiency;
        hourDeficit = Math.max(Math.abs(net) - served, 0);
      }
    } else {
      hourSurplus = Math.max(net, 0);
      hourDeficit = Math.max(-net, 0);
    }

    if (input.systemType === "hybrid" || input.systemType === "gridtie") {
      if (hourDeficit > 0) {
        hourGridImport = hourDeficit;
        hourDeficit = 0;
      }
      if (hourSurplus > 0) {
        if (input.systemType === "gridtie" || input.hybridMode === "self_consumption") {
          hourGridExport = hourSurplus;
          hourSurplus = 0;
        }
      }
    }

    if (hourDeficit > 0) deficitHours += 1;
    if (hourSurplus > 0 || hourGridExport > 0) surplusHours += 1;

    unservedLoadWh += hourDeficit;
    surplusEnergyWh += hourSurplus;
    gridImportWh += hourGridImport;
    gridExportWh += hourGridExport;
    totalLoadServedWh += loadWh - hourDeficit;

    minSocSeen = Math.min(minSocSeen, soc);
    maxSocSeen = Math.max(maxSocSeen, soc);
    socPercent.push(batteryCapacityWh ? round((soc / batteryCapacityWh) * 100, 2) : 0);
    deficitWh.push(round(hourDeficit));
    surplusWh.push(round(hourSurplus));
    gridImportSeries.push(round(hourGridImport));
    gridExportSeries.push(round(hourGridExport));
  });

  const monthlyProduction = MONTH_FACTORS.map((factor, index) => ({
    label: MONTH_LABELS[index],
    value: round((pv?.estimatedDailyProductionWh ?? 0) * 30 * factor),
  }));

  return {
    summary: {
      totalGenerationDailyWh: round(pvSeries.reduce((sum, value) => sum + value, 0)),
      totalGenerationMonthlyWh: round(monthlyProduction.reduce((sum, item) => sum + item.value, 0)),
      totalLoadServedWh: round(totalLoadServedWh),
      unservedLoadWh: round(unservedLoadWh),
      surplusEnergyWh: round(surplusEnergyWh),
      minSocPercent: batteryCapacityWh ? round((minSocSeen / batteryCapacityWh) * 100, 1) : 0,
      maxSocPercent: batteryCapacityWh ? round((maxSocSeen / batteryCapacityWh) * 100, 1) : 0,
      deficitHours,
      surplusHours,
      gridImportWh: round(gridImportWh),
      gridExportWh: round(gridExportWh),
    },
    series: {
      labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`),
      loadWh: loadSeries.map((value) => round(value)),
      pvWh: pvSeries.map((value) => round(value)),
      socPercent,
      deficitWh,
      surplusWh,
      gridImportWh: gridImportSeries,
      gridExportWh: gridExportSeries,
      monthlyProduction,
    },
  };
}
