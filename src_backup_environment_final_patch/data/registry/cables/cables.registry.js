import { SHIL_CABLE_BANK } from '../../../engineering/bank/index.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const cableRegistry = normalizeEquipmentBank(SHIL_CABLE_BANK, {
  category: 'cable',
  source: 'src/engineering/bank',
});
