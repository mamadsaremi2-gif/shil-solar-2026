import { panelRegistry } from './panels/panels.registry.js';
import { inverterRegistry } from './inverters/inverters.registry.js';
import { batteryRegistry } from './batteries/batteries.registry.js';
import { protectionRegistry } from './protection/protection.registry.js';
import { cableRegistry } from './cables/cables.registry.js';
import { environmentRegistry } from './environments/environments.registry.js';
import {
  selectEnabledEquipment,
  selectEquipmentBank,
  selectEquipmentById,
  searchEquipment,
  getRegistryStats,
} from './selectors/equipmentSelectors.js';

// Single source of truth for SHIL equipment and static engineering data.
// UI pages must read data from this registry instead of importing scattered banks.
export const equipmentRegistry = Object.freeze({
  panels: panelRegistry,
  batteries: batteryRegistry,
  inverters: inverterRegistry,
  protections: protectionRegistry,
  cables: cableRegistry,
  environments: environmentRegistry,
});

export function getEquipmentBank(type) {
  return selectEquipmentBank(equipmentRegistry, type);
}

export function getEnabledEquipment(type) {
  return selectEnabledEquipment(equipmentRegistry, type);
}

export function getEquipmentById(type, id) {
  return selectEquipmentById(equipmentRegistry, type, id);
}

export function findEquipment(type, query) {
  return searchEquipment(equipmentRegistry, type, query);
}

export function getEquipmentRegistryStats() {
  return getRegistryStats(equipmentRegistry);
}
