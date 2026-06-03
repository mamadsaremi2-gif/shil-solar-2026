// Canonical inverter bank moved to src/engineering/bank.
// Keep this adapter only for backward-compatible catalog imports.
import { SHIL_SOLAR_INVERTERS } from "../../engineering/bank/index.js";

export const inverterCatalog = SHIL_SOLAR_INVERTERS;
export function findInverter(id) {
  return inverterCatalog.find((item) => item.id === id) || null;
}
