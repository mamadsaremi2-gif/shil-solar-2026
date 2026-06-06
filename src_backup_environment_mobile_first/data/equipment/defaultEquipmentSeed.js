export const defaultEquipmentSeed = {
  pv: [
    { id: "pv_generic_430", type: "pv", manufacturer: "Generic", model: "Mono 430W", powerW: 430, voc: 38.9, vmp: 32.5, isc: 14.1, imp: 13.24 },
    { id: "pv_generic_550", type: "pv", manufacturer: "Generic", model: "Mono 550W", powerW: 550, voc: 49.8, vmp: 41.8, isc: 14, imp: 13.2 },
    { id: "pv_generic_700", type: "pv", manufacturer: "Generic", model: "Utility 700W", powerW: 700, voc: 52.5, vmp: 43.9, isc: 16.7, imp: 15.95 }
  ],
  inverter: [
    { id: "inv_generic_3k_offgrid", type: "inverter", manufacturer: "Generic", model: "Offgrid 3kW", ratedPowerW: 3000, maxDcVoltage: 150, mpptMinVoltage: 60, mpptMaxVoltage: 145 },
    { id: "inv_generic_5k_hybrid", type: "inverter", manufacturer: "Generic", model: "Hybrid 5kW", ratedPowerW: 5000, maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450 },
    { id: "inv_generic_10k_hybrid", type: "inverter", manufacturer: "Generic", model: "Hybrid 10kW", ratedPowerW: 10000, maxDcVoltage: 600, mpptMinVoltage: 150, mpptMaxVoltage: 550 }
  ],
  battery: [
    { id: "bat_generic_lfp_48_100", type: "battery", manufacturer: "Generic", model: "LFP 48V 100Ah", nominalVoltage: 48, capacityAh: 100, chemistry: "LFP" },
    { id: "bat_generic_lfp_51_200", type: "battery", manufacturer: "Generic", model: "LFP 51.2V 200Ah", nominalVoltage: 51.2, capacityAh: 200, chemistry: "LFP" }
  ]
};
