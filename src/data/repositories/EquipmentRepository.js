import { DEFAULT_EQUIPMENT_LIBRARY, EQUIPMENT_CATEGORIES } from "../seed/equipmentLibrary";

export const EquipmentRepository = {
  categories() {
    return EQUIPMENT_CATEGORIES;
  },
  list(category = null) {
    return category
      ? DEFAULT_EQUIPMENT_LIBRARY.filter((item) => item.category === category)
      : DEFAULT_EQUIPMENT_LIBRARY;
  },
  search({ category = null, query = "" } = {}) {
    const q = String(query || "").trim().toLowerCase();
    return this.list(category).filter((item) => !q || String(item.title || "").toLowerCase().includes(q));
  },
};
