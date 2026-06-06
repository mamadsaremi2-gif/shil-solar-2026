import { equipmentRegistry } from '../../data/registry/equipmentRegistry.js';

export function getBank(type) {
  return Array.isArray(equipmentRegistry?.[type]) ? equipmentRegistry[type] : [];
}

export function byId(type, id) {
  if (!id) return null;
  return getBank(type).find((item) => item.id === id) || null;
}

export function enabled(type) {
  return getBank(type).filter((item) => item.enabled !== false);
}

export function pickFirstCompatible(items, predicate) {
  return (Array.isArray(items) ? items : []).find((item) => {
    try { return predicate(item); } catch { return false; }
  }) || null;
}
