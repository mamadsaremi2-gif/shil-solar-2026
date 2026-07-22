import { SHIL_SOLAR_PROTECTION_BANK } from "./equipmentBank.js";

const entries = (bank = {}) => Object.entries(bank);
const withGroup = ([group, items]) => (Array.isArray(items) ? items : []).map((item, index) => ({
  id: item.id || `shil-protection-${group}-${index + 1}`,
  group,
  ...item,
}));

export const SHIL_DC_PROTECTION_BANK = Object.fromEntries(
  entries(SHIL_SOLAR_PROTECTION_BANK).filter(([group, items]) =>
    group !== "ac" && (Array.isArray(items) ? items : []).some((item) => item?.dc !== false)
  )
);

export const SHIL_AC_PROTECTION_BANK = Object.fromEntries(
  entries(SHIL_SOLAR_PROTECTION_BANK).filter(([group, items]) =>
    group === "ac" || (Array.isArray(items) ? items : []).some((item) => item?.ac === true)
  )
);

export const SHIL_PROTECTION_BANK_FLAT = entries(SHIL_SOLAR_PROTECTION_BANK).flatMap(withGroup);
export const SHIL_DC_PROTECTION_BANK_FLAT = entries(SHIL_DC_PROTECTION_BANK).flatMap(withGroup);
export const SHIL_AC_PROTECTION_BANK_FLAT = entries(SHIL_AC_PROTECTION_BANK).flatMap(withGroup);
export { SHIL_SOLAR_PROTECTION_BANK } from "./equipmentBank.js";
