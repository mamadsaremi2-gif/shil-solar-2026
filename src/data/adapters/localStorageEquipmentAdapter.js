const CUSTOM_KEY = 'solar-design-suite-custom-equipment';

export function loadCustomEquipment() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomEquipment(items) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
}

export function upsertCustomEquipment(equipment) {
  const items = loadCustomEquipment();
  const index = items.findIndex((item) => item.id === equipment.id);

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...equipment,
      updatedAt: new Date().toISOString(),
    };
  } else {
    items.unshift({
      ...equipment,
      createdAt: equipment.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveCustomEquipment(items);
  return items;
}

export function removeCustomEquipmentById(equipmentId) {
  const items = loadCustomEquipment().filter((item) => item.id !== equipmentId);
  saveCustomEquipment(items);
  return items;
}
