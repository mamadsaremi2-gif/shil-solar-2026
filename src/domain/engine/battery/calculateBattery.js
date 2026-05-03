const BATTERY_LIBRARY = {
  AGM: { roundTripEfficiency: 0.85, recommendedChargeC: 0.2, recommendedDischargeC: 0.5, cycleLife: 650, defaultDod: 0.6 },
  GEL: { roundTripEfficiency: 0.88, recommendedChargeC: 0.2, recommendedDischargeC: 0.5, cycleLife: 900, defaultDod: 0.5 },
  LFP: { roundTripEfficiency: 0.95, recommendedChargeC: 0.5, recommendedDischargeC: 1, cycleLife: 4000, defaultDod: 0.9 },
  NMC: { roundTripEfficiency: 0.93, recommendedChargeC: 0.7, recommendedDischargeC: 1, cycleLife: 2200, defaultDod: 0.85 },
};

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

const BACKUP_SYSTEM_VOLTAGES = [12, 24, 48];
const BACKUP_BATTERY_UNIT_VOLTAGES = [12, 24, 48];
const BACKUP_BATTERY_CAPACITIES = [50, 75, 100, 120, 150, 180, 200, 250, 300, 400];

function temperatureFactor(avgTemp) {
  if (avgTemp <= 0) return 1.25;
  if (avgTemp <= 5) return 1.18;
  if (avgTemp <= 15) return 1.08;
  if (avgTemp >= 40) return 1.08;
  if (avgTemp >= 35) return 1.05;
  return 1;
}

function getDischargeEfficiency(roundTripEfficiency) {
  return Math.sqrt(Math.max(roundTripEfficiency, 0.1));
}

function calculateRequiredBattery({ energyAtLoadWh, voltage, dod, inverterEfficiency, cableLossFactor, dischargeEfficiency, thermalFactor, reserveFactor }) {
  const denominator = Math.max(voltage * dod * inverterEfficiency * cableLossFactor * dischargeEfficiency, 1);
  return (energyAtLoadWh * thermalFactor * reserveFactor) / denominator;
}

function getUsableLoadWh(bankNominalWh, input, dischargeEfficiency, thermalFactor) {
  const effectiveNominalWh = bankNominalWh / Math.max(thermalFactor, 1);
  return effectiveNominalWh * input.dod * input.inverterEfficiency * input.cableLossFactor * dischargeEfficiency;
}

function buildBackupBatteryScenarios(input, loadResult, roundTripEfficiency, thermalFactor, reserveFactor) {
  const dischargeEfficiency = getDischargeEfficiency(roundTripEfficiency);
  const scenarios = [];

  for (const systemVoltage of BACKUP_SYSTEM_VOLTAGES) {
    const requiredBatteryAh = calculateRequiredBattery({
      energyAtLoadWh: loadResult.backupEnergyWh,
      voltage: systemVoltage,
      dod: input.dod,
      inverterEfficiency: input.inverterEfficiency,
      cableLossFactor: input.cableLossFactor,
      dischargeEfficiency,
      thermalFactor,
      reserveFactor,
    });

    for (const batteryUnitVoltage of BACKUP_BATTERY_UNIT_VOLTAGES) {
      if (batteryUnitVoltage > systemVoltage || systemVoltage % batteryUnitVoltage !== 0) continue;
      const seriesCount = Math.max(1, Math.ceil(systemVoltage / batteryUnitVoltage));

      for (const batteryUnitAh of BACKUP_BATTERY_CAPACITIES) {
        const parallelCount = Math.max(1, Math.ceil(requiredBatteryAh / batteryUnitAh));
        const totalCount = seriesCount * parallelCount;
        const bankNominalAh = parallelCount * batteryUnitAh;
        const bankNominalWh = bankNominalAh * systemVoltage;
        const usableBatteryWh = getUsableLoadWh(bankNominalWh, input, dischargeEfficiency, thermalFactor);
        const realBackupHours = usableBatteryWh / Math.max(loadResult.demandPowerW, 1);

        scenarios.push({
          systemVoltage,
          requiredBatteryAh: round(requiredBatteryAh),
          batteryUnitVoltage,
          batteryUnitAh,
          seriesCount,
          parallelCount,
          totalCount,
          bankNominalAh: round(bankNominalAh),
          bankNominalWh: round(bankNominalWh),
          usableBatteryWh: round(usableBatteryWh),
          realBackupHours: round(realBackupHours, 1),
          isSelected: systemVoltage === input.systemVoltage && batteryUnitVoltage === input.batteryUnitVoltage && batteryUnitAh === input.batteryUnitAh,
        });
      }
    }
  }
  return scenarios;
}

export function calculateBattery(input, loadResult) {
  if (input.systemType === "gridtie") {
    return {
      chemistry: input.batteryType,
      autonomyDays: 0,
      roundTripEfficiency: 1,
      dischargeEfficiency: 1,
      thermalFactor: 1,
      reserveFactor: 1,
      baseEnergyWh: 0,
      requiredBatteryWh: 0,
      requiredBatteryAh: 0,
      bankNominalAh: 0,
      bankNominalWh: 0,
      usableBatteryWh: 0,
      seriesCount: 0,
      parallelCount: 0,
      totalCount: 0,
      realBackupHours: 0,
      chargeCRate: 0,
      dischargeCRate: 0,
      recommendedChargeC: 0,
      recommendedDischargeC: 0,
      estimatedCycleLife: 0,
      scenarios: [],
    };
  }

  const chemistry = BATTERY_LIBRARY[input.batteryType] || BATTERY_LIBRARY.LFP;
  const roundTripEfficiency = input.batteryRoundTripEfficiency || chemistry.roundTripEfficiency;
  const dischargeEfficiency = getDischargeEfficiency(roundTripEfficiency);
  const reserveFactor = input.batteryReserveFactor || 1.1;
  const thermalFactor = temperatureFactor(input.averageTemperature);
  const autonomyDays = input.systemType === "offgrid" ? input.daysAutonomy : input.systemType === "hybrid" ? Math.max(0.25, input.daysAutonomy * 0.35) : 0;
  const hybridReserveFactor = input.systemType === "hybrid" ? (input.hybridMode === "backup_priority" ? 0.85 : input.hybridMode === "peak_shaving" ? 0.45 : 0.6) : 1;
  const baseEnergyWh = input.systemType === "offgrid"
    ? loadResult.totalDailyEnergyWh * autonomyDays
    : input.systemType === "hybrid"
      ? loadResult.totalDailyEnergyWh * autonomyDays * hybridReserveFactor
      : loadResult.backupEnergyWh;

  const requiredBatteryAh = calculateRequiredBattery({
    energyAtLoadWh: baseEnergyWh,
    voltage: input.systemVoltage,
    dod: input.dod,
    inverterEfficiency: input.inverterEfficiency,
    cableLossFactor: input.cableLossFactor,
    dischargeEfficiency,
    thermalFactor,
    reserveFactor,
  });
  const requiredBatteryWh = requiredBatteryAh * input.systemVoltage;

  const seriesCount = Math.max(1, Math.ceil(input.systemVoltage / input.batteryUnitVoltage));
  const batteryFactor = Math.max(input.batteryFactor || 1, 1);
  const calculatedParallelCount = Math.max(1, Math.ceil((requiredBatteryAh / input.batteryUnitAh) * batteryFactor));
  const manualParallelCount = input.systemType === "backup" && input.backupParallelCount > 0 ? Math.ceil(input.backupParallelCount) : 0;
  const parallelCount = Math.max(calculatedParallelCount, manualParallelCount);
  const totalCount = seriesCount * parallelCount;
  const bankNominalAh = parallelCount * input.batteryUnitAh;
  const bankNominalWh = bankNominalAh * input.systemVoltage;
  const usableBatteryWh = getUsableLoadWh(bankNominalWh, input, dischargeEfficiency, thermalFactor);
  const averageLoadW = Math.max(loadResult.totalDailyEnergyWh / 24, 1);
  const peakReferenceLoadW = input.systemType === "hybrid" ? Math.max(loadResult.demandPowerW * 0.7, 1) : Math.max(loadResult.demandPowerW, 1);
  const autonomyReferenceLoadW = input.systemType === "offgrid" ? averageLoadW : peakReferenceLoadW;
  const realBackupHoursAtPeak = usableBatteryWh / peakReferenceLoadW;
  const realBackupHours = usableBatteryWh / autonomyReferenceLoadW;
  const realAutonomyDays = realBackupHours / 24;
  const estimatedChargeCurrentA = input.systemType === "backup" ? 0 : ((loadResult.totalDailyEnergyWh / Math.max(input.sunHours, 1)) / Math.max(input.systemVoltage, 1));
  const estimatedDischargeCurrentA = loadResult.peakLoadPowerW / Math.max(input.systemVoltage * input.inverterEfficiency, 1);
  const chargeCRate = estimatedChargeCurrentA / Math.max(bankNominalAh, 1);
  const dischargeCRate = estimatedDischargeCurrentA / Math.max(bankNominalAh, 1);

  const scenarios = input.systemType === "backup"
    ? buildBackupBatteryScenarios(input, loadResult, roundTripEfficiency, thermalFactor, reserveFactor)
    : [];

  return {
    chemistry: input.batteryType,
    autonomyDays: round(autonomyDays, 2),
    hybridReserveFactor: round(hybridReserveFactor, 2),
    roundTripEfficiency: round(roundTripEfficiency, 3),
    dischargeEfficiency: round(dischargeEfficiency, 3),
    thermalFactor: round(thermalFactor, 3),
    reserveFactor: round(reserveFactor, 2),
    baseEnergyWh: round(baseEnergyWh),
    adjustedEnergyWh: round(baseEnergyWh / Math.max(input.inverterEfficiency * input.cableLossFactor * dischargeEfficiency, 0.1)),
    requiredBatteryWh: round(requiredBatteryWh),
    requiredBatteryAh: round(requiredBatteryAh),
    bankNominalAh: round(bankNominalAh),
    bankNominalWh: round(bankNominalWh),
    usableBatteryWh: round(usableBatteryWh),
    seriesCount,
    parallelCount,
    calculatedParallelCount,
    manualParallelCount,
    totalCount,
    realBackupHours: round(realBackupHours),
    realBackupHoursAtPeak: round(realBackupHoursAtPeak),
    realAutonomyDays: round(realAutonomyDays, 2),
    averageLoadW: round(averageLoadW),
    chargeCRate: round(chargeCRate, 3),
    dischargeCRate: round(dischargeCRate, 3),
    recommendedChargeC: chemistry.recommendedChargeC,
    recommendedDischargeC: chemistry.recommendedDischargeC,
    estimatedCycleLife: chemistry.cycleLife,
    scenarios,
  };
}
