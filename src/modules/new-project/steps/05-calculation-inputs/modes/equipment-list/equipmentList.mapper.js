export function mapEquipmentToLoadItem(equipment) {
  const specs = equipment?.specs || {};
  return {
    id: crypto.randomUUID(),
    name: specs.name || equipment.title,
    qty: specs.qty || 1,
    power: specs.power || 0,
    hours: specs.hours || 1,
    powerFactor: specs.powerFactor || 0.95,
    coincidenceFactor: specs.coincidenceFactor || 1,
    surgeFactor: specs.surgeFactor || 1,
    loadType: specs.loadType || "mixed",
    equipmentGroup: specs.equipmentGroup || equipment.brand,
  };
}
