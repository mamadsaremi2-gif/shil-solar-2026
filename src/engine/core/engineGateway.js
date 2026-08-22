import { runEngine } from './runEngine.js';

export function runSystemSettingsEngine(projectState = {}, options = {}) {
  return runEngine(projectState, { group: 'systemSettings', ...options });
}

export function runFinalCalculationEngine(projectState = {}, options = {}) {
  return runEngine(projectState, { group: 'finalCalculation', ...options });
}

export function runReportEngine(projectState = {}, options = {}) {
  return runEngine(projectState, { group: 'report', ...options });
}
