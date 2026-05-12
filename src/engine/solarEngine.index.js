export { runEngineeringDesign } from '../domain/engine/orchestrator/runEngineeringDesign';
export { normalizeInput } from '../domain/engine/input/normalizeInput';
export { validateInput } from '../domain/engine/input/validateInput';
export { calculateLoads } from '../domain/engine/load/calculateLoads';
export { calculateBattery } from '../domain/engine/battery/calculateBattery';
export { calculatePv } from '../domain/engine/pv/calculatePv';
export { calculateInverter } from '../domain/engine/inverter/calculateInverter';
export { calculateController } from '../domain/engine/controller/calculateController';
export { calculateCabling } from '../domain/engine/cable/calculateCabling';
export { calculateProtection } from '../domain/engine/protection/calculateProtection';
export { calculateFinancials } from '../domain/engine/financial/calculateFinancials';
export { buildProfessionalReportSnapshot } from '../domain/engine/report/buildProfessionalReportSnapshot';

export const ENGINE_MODULES = {
  orchestrator: 'runEngineeringDesign',
  input: ['normalizeInput', 'validateInput'],
  calculations: ['loads', 'battery', 'pv', 'inverter', 'controller', 'cabling', 'protection', 'financials'],
  reports: ['buildProfessionalReportSnapshot'],
};
