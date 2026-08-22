import { SHIL_LITHIUM_BATTERIES } from '../../../engineering/bank/index.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const batteryRegistry = normalizeEquipmentBank(SHIL_LITHIUM_BATTERIES, {
  category: 'battery',
  source: 'src/engineering/bank',
});
