export const inverterCatalog = [
  {
    id: "inv_hybrid_5kw_500v_generic",
    manufacturer: "Generic",
    model: "Hybrid 5kW 500V",
    type: "hybrid",
    ratedPowerW: 5000,
    surgePowerW: 8000,
    maxDcVoltage: 500,
    mpptMinVoltage: 120,
    mpptMaxVoltage: 450,
    efficiency: 0.95
  },
  {
    id: "inv_offgrid_3kw_150v_generic",
    manufacturer: "Generic",
    model: "Offgrid 3kW 150V",
    type: "offgrid",
    ratedPowerW: 3000,
    surgePowerW: 6000,
    maxDcVoltage: 150,
    mpptMinVoltage: 60,
    mpptMaxVoltage: 145,
    efficiency: 0.92
  }
];

export function findInverter(id) {
  return inverterCatalog.find((item) => item.id === id) || null;
}
