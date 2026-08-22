export class EquipmentDatabase {
  constructor(seed = {}) {
    this.items = new Map();
    for (const item of Object.values(seed).flat()) this.add(item);
  }

  add(item) {
    if (!item?.id) throw new Error("Equipment item requires id.");
    if (!item?.type) throw new Error("Equipment item requires type.");
    this.items.set(item.id, {
      ...item,
      updatedAt: item.updatedAt || new Date().toISOString()
    });
    return this.items.get(item.id);
  }

  get(id) {
    return this.items.get(id) || null;
  }

  list({ type, manufacturer, minPowerW, maxPowerW } = {}) {
    return [...this.items.values()].filter((item) => {
      if (type && item.type !== type) return false;
      if (manufacturer && item.manufacturer !== manufacturer) return false;
      if (minPowerW !== undefined && (item.powerW || item.ratedPowerW || 0) < minPowerW) return false;
      if (maxPowerW !== undefined && (item.powerW || item.ratedPowerW || 0) > maxPowerW) return false;
      return true;
    });
  }

  search(query) {
    const needle = String(query || "").toLowerCase();
    return [...this.items.values()].filter((item) =>
      [item.manufacturer, item.model, item.type, item.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }

  validateItem(id) {
    const item = this.get(id);
    if (!item) return { valid: false, errors: [`Equipment not found: ${id}`] };

    const errors = [];
    if (item.type === "pv" && (!item.powerW || !item.voc || !item.vmp)) errors.push("PV module requires powerW, voc and vmp.");
    if (item.type === "inverter" && (!item.ratedPowerW || !item.maxDcVoltage)) errors.push("Inverter requires ratedPowerW and maxDcVoltage.");
    if (item.type === "battery" && (!item.nominalVoltage || !item.capacityAh)) errors.push("Battery requires nominalVoltage and capacityAh.");

    return { valid: errors.length === 0, errors };
  }
}
