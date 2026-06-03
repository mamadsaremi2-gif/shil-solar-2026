// Canonical battery bank moved to src/engineering/bank.
// Keep this adapter only for backward-compatible catalog imports.
import { SHIL_LITHIUM_BATTERIES } from "../../engineering/bank/index.js";

export const batteryCatalog = SHIL_LITHIUM_BATTERIES;
export function findBattery(id) {
  return batteryCatalog.find((item) => item.id === id) || null;
}
