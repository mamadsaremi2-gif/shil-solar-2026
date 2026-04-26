function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getSurgeFactor(item, defaultSurgeFactor) {
  if (item.surgeFactor) return item.surgeFactor;
  if (item.loadType === "motor") return Math.max(defaultSurgeFactor, 2.5);
  if (item.loadType === "switching") return Math.max(defaultSurgeFactor, 1.2);
  return 1;
}

function normalizeProfile(profile = [], targetDailyWh = 0) {
  const rawFactors = profile.map((slot) => Math.max(Number(slot.factor) || 0, 0));
  const rawTotal = rawFactors.reduce((sum, value) => sum + value, 0);
  const baseTotal = targetDailyWh > 0 ? targetDailyWh : rawTotal;
  return rawFactors.map((factor, index) => ({
    hour: profile[index]?.hour ?? index,
    label: profile[index]?.label ?? `${String(index).padStart(2, "0")}:00`,
    factor,
    energyWh: rawTotal > 0 ? (factor / rawTotal) * baseTotal : 0,
  }));
}

export function calculateLoads(input) {
  const mode = input.calculationMode;
  let loadPowerW = 0;
  let totalDailyEnergyWh = 0;
  let currentA = 0;
  let demandPowerW = 0;
  let connectedPowerW = 0;
  let connectedApparentVA = 0;
  let demandApparentVA = 0;
  let surgePowerW = 0;
  let surgeApparentVA = 0;
  let peakLoadPowerW = 0;
  let normalizedLoads = [];
  let normalizedProfile = [];

  if (mode === "current") {
    currentA = input.current;
    loadPowerW = input.loadVoltage * currentA * input.powerFactor;
    demandPowerW = loadPowerW;
    connectedPowerW = loadPowerW;
    connectedApparentVA = input.loadVoltage * currentA;
    demandApparentVA = connectedApparentVA;
    totalDailyEnergyWh = loadPowerW * input.backupHours;
    surgePowerW = loadPowerW * input.surgeFactor;
    surgeApparentVA = surgePowerW / Math.max(input.powerFactor, 0.1);
  } else if (mode === "power") {
    loadPowerW = input.loadPower;
    demandPowerW = loadPowerW;
    connectedPowerW = loadPowerW;
    connectedApparentVA = loadPowerW / Math.max(input.powerFactor, 0.1);
    demandApparentVA = connectedApparentVA;
    currentA = loadPowerW / Math.max(input.loadVoltage * input.powerFactor, 1);
    totalDailyEnergyWh = loadPowerW * input.backupHours;
    surgePowerW = loadPowerW * input.surgeFactor;
    surgeApparentVA = surgePowerW / Math.max(input.powerFactor, 0.1);
  } else if (mode === "daily_energy") {
    totalDailyEnergyWh = input.dailyEnergyKwh * 1000;
    loadPowerW = totalDailyEnergyWh / Math.max(input.backupHours, 1);
    demandPowerW = loadPowerW;
    connectedPowerW = loadPowerW;
    connectedApparentVA = loadPowerW / Math.max(input.powerFactor, 0.1);
    demandApparentVA = connectedApparentVA;
    peakLoadPowerW = loadPowerW * input.peakFactor;
    surgePowerW = peakLoadPowerW;
    surgeApparentVA = surgePowerW / Math.max(input.powerFactor, 0.1);
    currentA = loadPowerW / Math.max(input.loadVoltage * input.powerFactor, 1);
  } else if (mode === "load_profile") {
    totalDailyEnergyWh = input.dailyEnergyKwh * 1000;
    normalizedProfile = normalizeProfile(input.loadProfile, totalDailyEnergyWh);
    peakLoadPowerW = normalizedProfile.reduce((max, slot) => Math.max(max, slot.energyWh), 0);
    loadPowerW = totalDailyEnergyWh / 24;
    demandPowerW = loadPowerW;
    connectedPowerW = peakLoadPowerW;
    connectedApparentVA = connectedPowerW / Math.max(input.powerFactor, 0.1);
    demandApparentVA = demandPowerW / Math.max(input.powerFactor, 0.1);
    surgePowerW = peakLoadPowerW * input.peakFactor;
    surgeApparentVA = surgePowerW / Math.max(input.powerFactor, 0.1);
    currentA = peakLoadPowerW / Math.max(input.loadVoltage * input.powerFactor, 1);
  } else {
    normalizedLoads = input.loadItems.map((item) => {
      const pf = Math.max(item.powerFactor || input.powerFactor || 0.95, 0.1);
      const totalConnected = item.qty * item.power;
      const totalConnectedVA = totalConnected / pf;
      const demand = totalConnected * item.coincidenceFactor;
      const demandVA = demand / pf;
      const energy = demand * item.hours;
      const surge = totalConnected * getSurgeFactor(item, input.surgeFactor) * item.coincidenceFactor;
      const surgeVA = surge / pf;
      return {
        ...item,
        totalConnectedPowerW: round(totalConnected),
        totalConnectedVA: round(totalConnectedVA),
        demandPowerW: round(demand),
        demandVA: round(demandVA),
        dailyEnergyWh: round(energy),
        surgePowerW: round(surge),
        surgeVA: round(surgeVA),
      };
    });

    connectedPowerW = normalizedLoads.reduce((sum, item) => sum + item.totalConnectedPowerW, 0);
    connectedApparentVA = normalizedLoads.reduce((sum, item) => sum + item.totalConnectedVA, 0);
    demandPowerW = normalizedLoads.reduce((sum, item) => sum + item.demandPowerW, 0);
    demandApparentVA = normalizedLoads.reduce((sum, item) => sum + item.demandVA, 0);
    totalDailyEnergyWh = normalizedLoads.reduce((sum, item) => sum + item.dailyEnergyWh, 0);
    surgePowerW = normalizedLoads.reduce((sum, item) => sum + item.surgePowerW, 0);
    surgeApparentVA = normalizedLoads.reduce((sum, item) => sum + item.surgeVA, 0);
    peakLoadPowerW = Math.max(demandPowerW, surgePowerW);
    loadPowerW = demandPowerW;
    currentA = loadPowerW / Math.max(input.loadVoltage * input.powerFactor, 1);
  }

  if (!connectedApparentVA) connectedApparentVA = (connectedPowerW || loadPowerW) / Math.max(input.powerFactor, 0.1);
  if (!demandApparentVA) demandApparentVA = (demandPowerW || loadPowerW) / Math.max(input.powerFactor, 0.1);
  if (!surgeApparentVA) surgeApparentVA = surgePowerW / Math.max(input.powerFactor, 0.1);
  if (!peakLoadPowerW) peakLoadPowerW = Math.max(loadPowerW, surgePowerW);

  const averageCoincidenceFactor = connectedPowerW > 0 ? demandPowerW / connectedPowerW : 1;
  const averagePowerFactor = connectedApparentVA > 0 ? connectedPowerW / connectedApparentVA : input.powerFactor;
  const designPowerW = demandPowerW * input.designFactor;
  const backupEnergyWh = demandPowerW * input.backupHours;

  return {
    mode,
    currentA: round(currentA),
    connectedPowerW: round(connectedPowerW || loadPowerW),
    connectedApparentVA: round(connectedApparentVA),
    demandPowerW: round(demandPowerW || loadPowerW),
    demandApparentVA: round(demandApparentVA),
    averageCoincidenceFactor: round(averageCoincidenceFactor, 3),
    averagePowerFactor: round(averagePowerFactor, 3),
    loadPowerW: round(loadPowerW),
    designPowerW: round(designPowerW),
    peakLoadPowerW: round(peakLoadPowerW),
    surgePowerW: round(Math.max(surgePowerW, designPowerW)),
    surgeApparentVA: round(Math.max(surgeApparentVA, designPowerW / Math.max(averagePowerFactor, 0.1))),
    totalDailyEnergyWh: round(totalDailyEnergyWh),
    backupEnergyWh: round(backupEnergyWh),
    normalizedLoads,
    normalizedProfile: normalizedProfile.map((slot) => ({
      ...slot,
      energyWh: round(slot.energyWh),
    })),
  };
}
