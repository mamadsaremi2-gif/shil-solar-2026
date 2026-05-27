import { SHIL_CABLE_BANK } from '../../shilSolarBanks.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const cableRegistry = normalizeEquipmentBank(SHIL_CABLE_BANK, {
  category: 'cable',
  source: 'src/data/shilSolarBanks.js',
});
