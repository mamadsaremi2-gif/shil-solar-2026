// Central SHIL engineering rules registry.
// All engineering logic must be registered here only.
// UI pages/components must never import rule files directly.

import { disabledCalculationRules } from './disabled.rules.js';
import { validationRule } from './core/validation.rules.js';
import { loadEstimationRule } from './electrical/load.rules.js';
import { panelSelectionRule } from './selection/panelSelection.rules.js';
import { inverterSelectionRule } from './selection/inverterSelection.rules.js';
import { batterySelectionRule } from './selection/batterySelection.rules.js';
import { stringDesignRule } from './electrical/stringDesign.rules.js';
import { voltageRule } from './electrical/voltage.rules.js';
import { environmentRule } from './electrical/environment.rules.js';
import { protectionRule } from './electrical/protection.rules.js';
import { cableRule } from './electrical/cable.rules.js';
import { dependencyRule } from './electrical/dependency.rules.js';
import { pvThermalRule } from './electrical/pvThermal.rules.js';
import { mpptOptimizerRule } from './electrical/mpptOptimizer.rules.js';
import { batteryAutonomyRule } from './electrical/batteryAutonomy.rules.js';
import { resultSummaryRule } from './summary/resultSummary.rules.js';
import { exportReadinessRule } from './summary/exportReadiness.rules.js';

export const ACTIVE_ENGINE_RULE_SEQUENCE = Object.freeze([
  'validation',
  'loadEstimation',
  'inverterSelection',
  'panelSelection',
  'batterySelection',
  'stringDesign',
  'pvThermal',
  'mpptOptimizer',
  'batteryAutonomy',
  'voltage',
  'environment',
  'protection',
  'cable',
  'dependency',
  'resultSummary',
  'exportReadiness',
]);

// v17 fix: disabled legacy placeholders must be registered first.
// In v16 they were spread after the active rules and accidentally overwrote
// the real voltage/protection/cable/environment rules. This was the main reason
// the equipment banks looked present in UI but were not truly driving the engine.
export const ruleRegistry = Object.freeze({
  ...disabledCalculationRules,

  validation: validationRule,
  loadEstimation: loadEstimationRule,
  panelSelection: panelSelectionRule,
  inverterSelection: inverterSelectionRule,
  batterySelection: batterySelectionRule,
  stringDesign: stringDesignRule,
  pvThermal: pvThermalRule,
  mpptOptimizer: mpptOptimizerRule,
  batteryAutonomy: batteryAutonomyRule,
  voltage: voltageRule,
  environment: environmentRule,
  protection: protectionRule,
  cable: cableRule,
  dependency: dependencyRule,
  resultSummary: resultSummaryRule,
  exportReadiness: exportReadinessRule,
});

export const ruleGroups = Object.freeze({
  systemSettings: ACTIVE_ENGINE_RULE_SEQUENCE,
  finalCalculation: ACTIVE_ENGINE_RULE_SEQUENCE,
  report: ACTIVE_ENGINE_RULE_SEQUENCE,
  engineering: ACTIVE_ENGINE_RULE_SEQUENCE,
  validationOnly: ['validation'],
  equipmentSizing: ['validation', 'loadEstimation', 'inverterSelection', 'panelSelection', 'batterySelection'],
  electricalDesign: ['validation', 'loadEstimation', 'inverterSelection', 'panelSelection', 'batterySelection', 'stringDesign', 'pvThermal', 'mpptOptimizer', 'batteryAutonomy', 'voltage', 'environment', 'protection', 'cable', 'dependency', 'resultSummary', 'exportReadiness'],
  disabledCatalog: Object.keys(disabledCalculationRules),
});

export function getActiveRuleNames() {
  return [...ACTIVE_ENGINE_RULE_SEQUENCE];
}
