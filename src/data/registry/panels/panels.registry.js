import { SHIL_SOLAR_PANELS } from '../../shilSolarBanks.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const panelRegistry = normalizeEquipmentBank(SHIL_SOLAR_PANELS, {
  category: 'panel',
  source: 'src/data/shilSolarBanks.js',
});
