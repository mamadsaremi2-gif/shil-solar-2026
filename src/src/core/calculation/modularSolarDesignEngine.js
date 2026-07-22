const STANDARD_BREAKERS_A = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 630, 800];
const STANDARD_CABLES = [
  { mm2: 4, currentA: 32 },
  { mm2: 6, currentA: 45 },
  { mm2: 10, currentA: 65 },
  { mm2: 16, currentA: 85 },
  { mm2: 25, currentA: 110 },
  { mm2: 35, currentA: 140 },
  { mm2: 50, currentA: 170 },
  { mm2: 70, currentA: 220 },
  { mm2: 95, currentA: 260 },
  { mm2: 120, currentA: 300 }
];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nextBreaker(currentA) {
  return STANDARD_BREAKERS_A.find((rating) => rating >= currentA) || STANDARD_BREAKERS_A[STANDARD_BREAKERS_A.length - 1];
}

function cableFor(currentA) {
  return STANDARD_CABLES.find((item) => item.currentA >= currentA) || STANDARD_CABLES[STANDARD_CABLES.length - 1];
}

function coldVoc(panel, series, minTempC) {
  const coeff = Math.abs(num(panel.tempCoeffVocPctC ?? panel.tempCoeffVocPercentPerC, -0.25)) / 100;
  return num(panel.voc, 0) * series * (1 + coeff * (25 - num(minTempC, 0)));
}

function bestSeriesCount(panel, inverter, minTempC) {
  const mpptMin = num(inverter.mpptMinV ?? inverter.mpptMinVoltage, 60);
  const mpptMax = num(inverter.mpptMaxV ?? inverter.mpptMaxVoltage, 450);
  const maxVoc = num(inverter.maxPvVocV ?? inverter.maxDcVoltage ?? inverter.maxPvVoc, 500);
  let best = 1;
  for (let series = 1; series <= 40; series += 1) {
    const vmp = num(panel.vmp, 0) * series;
    const vocC = coldVoc(panel, series, minTempC);
    if (vmp >= mpptMin && vmp <= mpptMax && vocC <= maxVoc) best = series;
  }
  return best;
}

function distribute(total, buckets) {
  const safeBuckets = Math.max(1, Math.round(num(buckets, 1)));
  const safeTotal = Math.max(0, Math.round(num(total, 0)));
  const base = Math.floor(safeTotal / safeBuckets);
  const rest = safeTotal % safeBuckets;
  return Array.from({ length: safeBuckets }, (_, index) => base + (index < rest ? 1 : 0));
}

export function runModularSolarDesign({
  totalLoadW,
  selectedInverter,
  selectedPanel,
  selectedBattery,
  acVoltage = 220,
  backupHours = 5,
  reserveFactor = 1.15,
  mpptPerInverter,
  minTempC = -5,
  systemLossPercent = 15,
  batteryMode = "per-inverter"
}) {
  const loadW = Math.max(0, num(totalLoadW, 0));
  const inverterPowerW = Math.max(1, num(selectedInverter?.ratedPowerW, 8000));
  const inverterCount = Math.max(1, Math.ceil((loadW * num(reserveFactor, 1.15)) / inverterPowerW));
  const effectiveMpptPerInverter = Math.max(1, Math.round(num(mpptPerInverter ?? selectedInverter?.mpptCount, selectedInverter?.mpptCount || 1)));
  const totalMppt = inverterCount * effectiveMpptPerInverter;
  const perInverterLoadW = inverterCount ? loadW / inverterCount : loadW;
  const pvTargetPerInverterW = Math.min(
    num(selectedInverter?.maxPvPowerW, perInverterLoadW * 1.35),
    perInverterLoadW * (1 + num(systemLossPercent, 15) / 100) * 1.15
  );
  const panelPowerW = Math.max(1, num(selectedPanel?.powerW, 550));
  const panelsPerInverter = Math.max(1, Math.ceil(pvTargetPerInverterW / panelPowerW));
  const totalPanels = panelsPerInverter * inverterCount;
  const series = bestSeriesCount(selectedPanel || {}, selectedInverter || {}, minTempC);
  const mpptPanelDistribution = distribute(panelsPerInverter, effectiveMpptPerInverter);
  const batteryWh = num(selectedBattery?.energyWh, num(selectedBattery?.nominalVoltage, 51.2) * num(selectedBattery?.capacityAh, 100));
  const dod = num(selectedBattery?.usableDod, 0.9);
  const usableBatteryWh = batteryWh * dod;
  const requiredBatteryWhPerInverter = perInverterLoadW * num(backupHours, 0);
  const batteriesPerInverter = requiredBatteryWhPerInverter > 0 ? Math.max(1, Math.ceil(requiredBatteryWhPerInverter / Math.max(usableBatteryWh, 1))) : 0;
  const totalBatteries = batteryMode === "shared" ? Math.max(1, Math.ceil((loadW * num(backupHours, 0)) / Math.max(usableBatteryWh, 1))) : batteriesPerInverter * inverterCount;

  const modules = Array.from({ length: inverterCount }, (_, invIndex) => {
    const acCurrentA = perInverterLoadW / Math.max(num(acVoltage, 220), 1);
    const batteryCurrentA = perInverterLoadW / Math.max(num(selectedInverter?.batteryVoltage ?? selectedBattery?.nominalVoltage, 48), 1);
    const mppts = mpptPanelDistribution.map((panelCount, mpptIndex) => {
      const parallel = panelCount > 0 ? Math.max(1, Math.ceil(panelCount / Math.max(series, 1))) : 0;
      const panelsOnMppt = series * parallel;
      const stringCurrentA = num(selectedPanel?.isc, 0) * parallel;
      const dcBreakerA = nextBreaker(stringCurrentA * 1.25);
      return {
        mpptIndex: mpptIndex + 1,
        panelCount: panelsOnMppt,
        series,
        parallel,
        powerW: panelsOnMppt * panelPowerW,
        vmpV: num(selectedPanel?.vmp, 0) * series,
        vocColdV: Number(coldVoc(selectedPanel || {}, series, minTempC).toFixed(1)),
        currentA: Number(stringCurrentA.toFixed(1)),
        protection: {
          dcBreakerA,
          stringFuseA: nextBreaker(num(selectedPanel?.isc, 0) * 1.25),
          spd: num(selectedInverter?.maxPvVocV ?? selectedInverter?.maxDcVoltage, 500) > 600 ? "SPD DC 1000/1500V Type 2" : "SPD DC 600V Type 2",
          dcCable: `${cableFor(Math.max(stringCurrentA, num(selectedPanel?.isc, 0))).mm2}mm² PV`
        }
      };
    });

    return {
      inverterIndex: invIndex + 1,
      inverterTitle: selectedInverter?.title || `${Math.round(inverterPowerW / 1000)}kW inverter`,
      loadShareW: Math.round(perInverterLoadW),
      panelCount: panelsPerInverter,
      pvPowerW: panelsPerInverter * panelPowerW,
      mpptCount: effectiveMpptPerInverter,
      mppts,
      batteries: batteryMode === "shared" ? "بانک مشترک" : batteriesPerInverter,
      protection: {
        acBreakerA: nextBreaker(acCurrentA * 1.25),
        acCable: `${cableFor(acCurrentA * 1.25).mm2}mm² AC`,
        batteryBreakerA: nextBreaker(batteryCurrentA * 1.25),
        batteryCable: `${cableFor(batteryCurrentA * 1.25).mm2}mm² DC Battery`
      }
    };
  });

  const warnings = [];
  if (!selectedInverter?.parallelCapable && inverterCount > 1) warnings.push("اینورتر انتخاب‌شده برای چند واحد موازی علامت‌گذاری نشده است؛ قابلیت Parallel باید تأیید شود.");
  if (selectedPanel?.powerRangeW || selectedPanel?.vmpRangeV || selectedPanel?.vocRangeV) warnings.push("بانک پنل هنوز بازه‌ای است؛ محاسبه دقیق نیازمند پنل انفرادی است.");
  if (loadW >= 20000) warnings.push("پروژه در کلاس سنگین است؛ حفاظت، کابل و MPPT برای هر اینورتر مستقل محاسبه شده‌اند.");

  return {
    totalLoadW: loadW,
    inverterCount,
    totalMppt,
    panelsPerInverter,
    totalPanels,
    batteriesPerInverter: batteryMode === "shared" ? null : batteriesPerInverter,
    totalBatteries,
    batteryMode,
    modules,
    warnings,
    summary: `برای ${Math.round(loadW / 1000)}kW با اینورتر ${Math.round(inverterPowerW / 1000)}kW، ${inverterCount} اینورتر و ${totalMppt} MPPT طراحی شد.`
  };
}
