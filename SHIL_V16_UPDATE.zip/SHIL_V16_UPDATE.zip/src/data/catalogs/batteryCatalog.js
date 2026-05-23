export const batteryCatalog = [
  {
    id: "bat_lfp_48v_100ah_generic",
    manufacturer: "Generic",
    model: "LFP 48V 100Ah",
    chemistry: "LFP",
    nominalVoltage: 48,
    capacityAh: 100,
    recommendedDoD: 0.8,
    roundTripEfficiency: 0.92
  },
  {
    id: "bat_lfp_51v_200ah_generic",
    manufacturer: "Generic",
    model: "LFP 51.2V 200Ah",
    chemistry: "LFP",
    nominalVoltage: 51.2,
    capacityAh: 200,
    recommendedDoD: 0.85,
    roundTripEfficiency: 0.94
  }
];

export function findBattery(id) {
  return batteryCatalog.find((item) => item.id === id) || null;
}
