import { DEFAULT_EQUIPMENT_LIBRARY, EQUIPMENT_CATEGORIES } from '../seed/equipmentLibrary';
import { toEnglishDigits } from '../../shared/utils/faNumbers';
import {
  loadCustomEquipment,
  removeCustomEquipmentById,
  saveCustomEquipment,
  upsertCustomEquipment,
} from '../adapters/localStorageEquipmentAdapter';

function normalizeSearch(text) {
  return toEnglishDigits(String(text || '')).toLowerCase().trim();
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const EquipmentRepository = {
  categories() {
    return EQUIPMENT_CATEGORIES;
  },
  list(category = null) {
    const custom = loadCustomEquipment();
    const all = [...DEFAULT_EQUIPMENT_LIBRARY, ...custom];
    return category ? all.filter((item) => item.category === category) : all;
  },
  listCustom(category = null) {
    const custom = loadCustomEquipment();
    return category ? custom.filter((item) => item.category === category) : custom;
  },
  search({ category = null, query = '' } = {}) {
    const q = normalizeSearch(query);
    return this.list(category).filter((item) => {
      if (!q) return true;
      return [item.title, item.brand, item.model, item.summary, item.specs?.name, item.specs?.power].some((part) => normalizeSearch(part).includes(q));
    });
  },
  getById(equipmentId) {
    return this.list().find((item) => item.id === equipmentId) ?? null;
  },
  addCustomEquipment(payload) {
    const title = String(payload.title || '').trim();
    if (!title) throw new Error('عنوان تجهیز الزامی است.');
    if (!payload.category) throw new Error('دسته تجهیز الزامی است.');

    const next = {
      id: payload.id || `custom-${payload.category}-${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`,
      category: payload.category,
      brand: payload.brand || 'Custom',
      model: payload.model || 'Manual',
      title,
      summary: payload.summary || 'تجهیز سفارشی تعریف شده توسط کاربر',
      specs: payload.specs || {},
      isCustom: true,
    };
    const items = loadCustomEquipment();
    items.unshift(next);
    saveCustomEquipment(items);
    return next;
  },
  updateCustomEquipment(payload) {
    const title = String(payload.title || '').trim();
    if (!payload.id) throw new Error('شناسه تجهیز برای ویرایش الزامی است.');
    if (!title) throw new Error('عنوان تجهیز الزامی است.');
    if (!payload.category) throw new Error('دسته تجهیز الزامی است.');

    const next = {
      id: payload.id,
      category: payload.category,
      brand: payload.brand || 'Custom',
      model: payload.model || 'Manual',
      title,
      summary: payload.summary || 'تجهیز سفارشی تعریف شده توسط کاربر',
      specs: payload.specs || {},
      isCustom: true,
    };

    upsertCustomEquipment(next);
    return next;
  },
  removeCustomEquipment(equipmentId) {
    return removeCustomEquipmentById(equipmentId);
  },
};
