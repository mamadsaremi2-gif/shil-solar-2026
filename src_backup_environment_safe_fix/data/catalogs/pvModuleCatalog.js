export const pvModuleCatalog = [
  {
    id: "pv_550_mono_generic",
    manufacturer: "Generic",
    model: "Mono 550W",
    powerW: 550,
    voc: 49.8,
    vmp: 41.8,
    isc: 14,
    imp: 13.2,
    tempCoeffVocPercentPerC: -0.28
  },
  {
    id: "pv_430_mono_generic",
    manufacturer: "Generic",
    model: "Mono 430W",
    powerW: 430,
    voc: 38.9,
    vmp: 32.5,
    isc: 14.1,
    imp: 13.24,
    tempCoeffVocPercentPerC: -0.29
  }
];

export function findPVModule(id) {
  return pvModuleCatalog.find((item) => item.id === id) || null;
}
