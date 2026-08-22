export function normalizeEquipmentItem(item = {}, defaults = {}) {
  const id = item.id || item.model || item.title || item.name;
  return Object.freeze({
    ...defaults,
    ...item,
    id: String(id || `equipment-${Date.now()}`),
    label: item.label || item.title || item.name || item.model || String(id || 'بدون عنوان'),
    enabled: item.enabled !== false,
  });
}

export function normalizeEquipmentBank(items = [], defaults = {}) {
  return Object.freeze((Array.isArray(items) ? items : []).map((item) => normalizeEquipmentItem(item, defaults)));
}

export function byId(items = [], id) {
  return (Array.isArray(items) ? items : []).find((item) => item.id === id) || null;
}

export function filterEnabled(items = []) {
  return (Array.isArray(items) ? items : []).filter((item) => item.enabled !== false);
}

export function searchByText(items = [], query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return filterEnabled(items);
  return filterEnabled(items).filter((item) => {
    const haystack = [item.id, item.label, item.title, item.name, item.model, item.brand, item.type, item.technology]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
