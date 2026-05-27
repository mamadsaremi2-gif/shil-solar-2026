import { SHIL_SOLAR_PROTECTION_BANK } from '../../shilSolarBanks.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

const flattenProtectionBank = (bank = {}) => Object.entries(bank).flatMap(([group, items]) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || `protection-${group}-${index + 1}`,
    group,
    ...item,
  }))
);

export const protectionRegistry = normalizeEquipmentBank(flattenProtectionBank(SHIL_SOLAR_PROTECTION_BANK), {
  category: 'protection',
  source: 'src/data/shilSolarBanks.js',
});
