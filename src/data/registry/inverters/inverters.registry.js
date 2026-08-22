import { SHIL_SOLAR_INVERTERS } from '../../../engineering/bank/index.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const inverterRegistry = normalizeEquipmentBank(SHIL_SOLAR_INVERTERS, {
  category: 'inverter',
  source: 'src/engineering/bank',
});
