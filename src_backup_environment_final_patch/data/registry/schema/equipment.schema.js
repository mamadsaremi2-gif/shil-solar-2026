export const EQUIPMENT_TYPES = Object.freeze({
  PANEL: 'panel',
  BATTERY: 'battery',
  INVERTER: 'inverter',
  CABLE: 'cable',
  PROTECTION: 'protection',
  ENVIRONMENT: 'environment',
});

export function normalizeEquipmentItem(item = {}, type = 'unknown') {
  return {
    id: item.id || `${type}-${item.brand || 'generic'}-${item.model || 'unknown'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    type: item.type || type,
    enabled: item.enabled !== false,
    brand: item.brand || 'SHIL',
    model: item.model || item.name || 'Unknown',
    specs: item.specs || {},
    tags: Array.isArray(item.tags) ? item.tags : [],
    raw: item,
  };
}
