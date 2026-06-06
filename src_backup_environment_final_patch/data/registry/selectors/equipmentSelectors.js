import { byId, filterEnabled, searchByText } from '../utils/normalizeEquipment.js';

export const selectEquipmentBank = (registry, type) => registry?.[type] || [];
export const selectEnabledEquipment = (registry, type) => filterEnabled(selectEquipmentBank(registry, type));
export const selectEquipmentById = (registry, type, id) => byId(selectEquipmentBank(registry, type), id);
export const searchEquipment = (registry, type, query) => searchByText(selectEquipmentBank(registry, type), query);

export function getRegistryStats(registry = {}) {
  return Object.freeze(Object.fromEntries(
    Object.entries(registry).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  ));
}
