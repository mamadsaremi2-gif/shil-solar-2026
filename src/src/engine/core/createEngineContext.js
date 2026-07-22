import { equipmentRegistry } from '../../data/registry/equipmentRegistry.js';

export function createEngineContext(input = {}, options = {}) {
  return Object.freeze({
    input: input && typeof input === 'object' ? input : {},
    options: options && typeof options === 'object' ? options : {},
    registry: equipmentRegistry,
    now: new Date().toISOString(),
  });
}
