import { SHIL_SOLAR_PANELS } from '../../../engineering/bank/index.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const panelRegistry = normalizeEquipmentBank(SHIL_SOLAR_PANELS, {
  category: 'panel',
  source: 'src/engineering/bank',
});
