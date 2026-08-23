import { panelRegistry } from './panels/panels.registry.js';
import { inverterRegistry } from './inverters/inverters.registry.js';
import { batteryRegistry } from './batteries/batteries.registry.js';
import { protectionRegistry } from './protection/protection.registry.js';
import { cableRegistry } from './cables/cables.registry.js';
import { environmentRegistry } from './environments/environments.registry.js';
import { getCachedRuntimeData, RUNTIME_KEYS } from '../../services/runtimeAppDataService.js';
import { normalizeEquipmentBank } from './utils/normalizeEquipment.js';
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

const runtimeGroupMap = { panels: "solarPanels", inverters: "solarInverters", batteries: "batteries", protections: "protections", cables: "cables" };

function adaptRuntimeItem(type, item = {}) {
  const common = { ...item, enabled: item.active !== false, label: item.title || item.label || item.model || item.id };
  if (type === "panels") return { ...common, powerW: Number(item.powerW ?? item.ratedPowerW ?? 0), voltageV: Number(item.voltageV ?? item.vmp ?? 0), currentA: Number(item.currentA ?? item.imp ?? 0) };
  if (type === "inverters") return { ...common, ratedPowerW: Number(item.ratedPowerW ?? Number(item.powerKw || 0) * 1000), powerKw: Number(item.powerKw ?? Number(item.ratedPowerW || 0) / 1000), dcVoltage: Number(item.dcVoltage ?? item.dcVoltageV ?? item.batteryVoltageV ?? 0), batteryVoltage: Number(item.batteryVoltage ?? item.dcVoltageV ?? item.batteryVoltageV ?? 0) };
  if (type === "batteries") return { ...common, nominalVoltage: Number(item.nominalVoltage ?? item.voltageV ?? 0), capacityAh: Number(item.capacityAh ?? 0), dod: Number(item.dod ?? 0.8) };
  return common;
}

export function getEquipmentBank(type) {
  const fallback = selectEquipmentBank(equipmentRegistry, type);
  const catalog = getCachedRuntimeData(RUNTIME_KEYS.equipmentCatalog, null);
  const group = runtimeGroupMap[type];
  if (!catalog || !group || !Array.isArray(catalog[group]) || !catalog[group].length) return fallback;
  const runtime = normalizeEquipmentBank(catalog[group].map((item) => adaptRuntimeItem(type, item)), { category: type, source: "admin-runtime" });

  // Protection records published from Admin are intentionally user-editable and may
  // contain only commercial fields (title/rating/standard).  Do not let a partial
  // runtime catalog erase the richer engineering protection families used by the
  // sizing engine.  Runtime rows override matching static IDs and custom rows are
  // appended, while untouched engineering families remain available for selection.
  if (type === "protections") {
    const runtimeIds = new Set(runtime.map((item) => item.id));
    return Object.freeze([
      ...runtime,
      ...fallback.filter((item) => !runtimeIds.has(item.id)),
    ]);
  }

  return runtime;
}

export function getEnabledEquipment(type) {
  return getEquipmentBank(type).filter((item) => item.enabled !== false && item.active !== false && item.publishStatus !== "retired");
}

export function getEquipmentById(type, id) {
  return getEquipmentBank(type).find((item) => item.id === id) || null;
}

export function findEquipment(type, query) {
  const q = String(query || "").trim().toLowerCase();
  return getEnabledEquipment(type).filter((item) => !q || [item.id,item.label,item.title,item.name,item.model,item.brand,item.type].filter(Boolean).join(" ").toLowerCase().includes(q));
}

export function getEquipmentRegistryStats() {
  return getRegistryStats(equipmentRegistry);
}
