import { SHIL_SOLAR_INVERTERS } from '../../shilSolarBanks.js';
import { normalizeEquipmentBank } from '../utils/normalizeEquipment.js';

export const inverterRegistry = normalizeEquipmentBank(SHIL_SOLAR_INVERTERS, {
  category: 'inverter',
  source: 'src/data/shilSolarBanks.js',
});
