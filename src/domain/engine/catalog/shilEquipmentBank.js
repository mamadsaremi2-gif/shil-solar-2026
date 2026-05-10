export const SHIL_PANEL_BANK = [
  { id: "shil-panel-450m", category: "panel", brand: "SHIL", model: "SHIL-PV-450M", powerW: 450, vocV: 49.5, vmpV: 41.2, iscA: 11.6, impA: 10.92, tempCoeffVoc: 0.0026, tempCoeffPowerPercent: 0.34, lengthM: 2.1, widthM: 1.04 },
  { id: "shil-panel-550m", category: "panel", brand: "SHIL", model: "SHIL-PV-550M", powerW: 550, vocV: 49.9, vmpV: 41.8, iscA: 13.9, impA: 13.16, tempCoeffVoc: 0.0024, tempCoeffPowerPercent: 0.32, lengthM: 2.28, widthM: 1.13 },
  { id: "shil-panel-585n", category: "panel", brand: "SHIL", model: "SHIL-PV-585N", powerW: 585, vocV: 53.1, vmpV: 44.8, iscA: 13.95, impA: 13.06, tempCoeffVoc: 0.0024, tempCoeffPowerPercent: 0.29, lengthM: 2.28, widthM: 1.13 },
  { id: "shil-panel-700n", category: "panel", brand: "SHIL", model: "SHIL-PV-700N", powerW: 700, vocV: 54.6, vmpV: 45.7, iscA: 16.2, impA: 15.32, tempCoeffVoc: 0.0023, tempCoeffPowerPercent: 0.29, lengthM: 2.38, widthM: 1.30 },
];

export const SHIL_INVERTER_BANK = [
  { id: "shil-ups-12-1k", category: "backup_inverter", brand: "SHIL", model: "SHIL-UPS-12-1K", systemType: "backup", acPowerW: 1000, surgeW: 2000, dcVoltageV: 12, efficiency: 0.9, parallelCapable: false, maxParallelUnits: 1 },
  { id: "shil-ups-24-3k", category: "backup_inverter", brand: "SHIL", model: "SHIL-UPS-24-3K", systemType: "backup", acPowerW: 3000, surgeW: 6000, dcVoltageV: 24, efficiency: 0.92, parallelCapable: false, maxParallelUnits: 1 },
  { id: "shil-ups-48-6k", category: "backup_inverter", brand: "SHIL", model: "SHIL-UPS-48-6K", systemType: "backup", acPowerW: 6000, surgeW: 12000, dcVoltageV: 48, efficiency: 0.93, parallelCapable: true, maxParallelUnits: 4 },
  { id: "shil-hybrid-48-6k", category: "hybrid_inverter", brand: "SHIL", model: "SHIL-HYB-48-6K", systemType: "hybrid", acPowerW: 6000, surgeW: 12000, dcVoltageV: 48, mpptCount: 2, maxPvVocV: 500, mpptMinVoltageV: 120, mpptMaxVoltageV: 450, maxInputCurrentPerMpptA: 18, maxShortCircuitCurrentPerMpptA: 25, maxPvPowerW: 7800, parallelCapable: true, maxParallelUnits: 6 },
  { id: "shil-hybrid-48-10k", category: "hybrid_inverter", brand: "SHIL", model: "SHIL-HYB-48-10K", systemType: "hybrid", acPowerW: 10000, surgeW: 20000, dcVoltageV: 48, mpptCount: 2, maxPvVocV: 500, mpptMinVoltageV: 120, mpptMaxVoltageV: 450, maxInputCurrentPerMpptA: 22, maxShortCircuitCurrentPerMpptA: 30, maxPvPowerW: 13000, parallelCapable: true, maxParallelUnits: 6 },
  { id: "shil-offgrid-96-15k", category: "offgrid_inverter", brand: "SHIL", model: "SHIL-OFF-96-15K", systemType: "offgrid", acPowerW: 15000, surgeW: 30000, dcVoltageV: 96, mpptCount: 3, maxPvVocV: 600, mpptMinVoltageV: 150, mpptMaxVoltageV: 520, maxInputCurrentPerMpptA: 22, maxShortCircuitCurrentPerMpptA: 30, maxPvPowerW: 19500, parallelCapable: true, maxParallelUnits: 4 },
  { id: "shil-ongrid-10k", category: "ongrid_inverter", brand: "SHIL", model: "SHIL-ON-10K", systemType: "gridtie", acPowerW: 10000, dcVoltageV: 600, mpptCount: 2, maxPvVocV: 1100, mpptMinVoltageV: 180, mpptMaxVoltageV: 900, maxInputCurrentPerMpptA: 16, maxShortCircuitCurrentPerMpptA: 24, maxPvPowerW: 15000, parallelCapable: true, maxParallelUnits: 10 },
  { id: "shil-ongrid-50k", category: "ongrid_inverter", brand: "SHIL", model: "SHIL-ON-50K", systemType: "gridtie", acPowerW: 50000, dcVoltageV: 1000, mpptCount: 6, maxPvVocV: 1100, mpptMinVoltageV: 200, mpptMaxVoltageV: 1000, maxInputCurrentPerMpptA: 30, maxShortCircuitCurrentPerMpptA: 40, maxPvPowerW: 75000, parallelCapable: true, maxParallelUnits: 20 },
];

export const SHIL_BATTERY_BANK = [
  { id: "shil-bat-12-100-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-12-100-LFP", voltageV: 12.8, capacityAh: 100, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
  { id: "shil-bat-12-200-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-12-200-LFP", voltageV: 12.8, capacityAh: 200, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
  { id: "shil-bat-24-100-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-24-100-LFP", voltageV: 25.6, capacityAh: 100, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
  { id: "shil-bat-24-200-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-24-200-LFP", voltageV: 25.6, capacityAh: 200, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
  { id: "shil-bat-48-100-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-48-100-LFP", voltageV: 51.2, capacityAh: 100, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
  { id: "shil-bat-48-200-lfp", category: "battery", brand: "SHIL", model: "SHIL-BAT-48-200-LFP", voltageV: 51.2, capacityAh: 200, chemistry: "LFP", dod: 0.85, roundTripEfficiency: 0.95 },
];

export function getEngineeringEquipmentBank() {
  return {
    panels: SHIL_PANEL_BANK,
    inverters: SHIL_INVERTER_BANK,
    batteries: SHIL_BATTERY_BANK,
  };
}

export function findNearestShilInverter({ systemType, requiredPowerW, dcVoltageV }) {
  const filtered = SHIL_INVERTER_BANK.filter((item) => {
    const sameType = systemType === "gridtie" ? item.systemType === "gridtie" : item.systemType === systemType || (systemType === "backup" && item.category === "backup_inverter");
    const voltageOk = !dcVoltageV || !item.dcVoltageV || Math.abs(Number(item.dcVoltageV) - Number(dcVoltageV)) <= (Number(dcVoltageV) >= 96 ? 10 : 4);
    return sameType && voltageOk;
  });
  return [...filtered].sort((a, b) => Math.abs(a.acPowerW - requiredPowerW) - Math.abs(b.acPowerW - requiredPowerW))[0] || null;
}
