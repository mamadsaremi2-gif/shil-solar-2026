import { SHIL_LITHIUM_BATTERIES } from '../../shilSolarBanks.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const batteryRegistry = normalizeEquipmentBank(SHIL_LITHIUM_BATTERIES, {
  category: 'battery',
  source: 'src/data/shilSolarBanks.js',
});
