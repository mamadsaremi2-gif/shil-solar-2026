/**
 * @typedef {"offgrid" | "hybrid" | "ongrid"} ProjectScenario
 *
 * @typedef {Object} ProjectInfo
 * @property {string} title
 * @property {ProjectScenario} scenario
 * @property {string} location
 * @property {number} dailyEnergyWh
 * @property {number} peakLoadW
 * @property {number} autonomyDays
 *
 * @typedef {Object} EngineeringForm
 * @property {ProjectInfo} project
 * @property {Object} pv
 * @property {Object} battery
 * @property {Object} inverter
 * @property {Object} cable
 * @property {Object} environment
 *
 * @typedef {Object} EngineeringResult
 * @property {boolean} valid
 * @property {Array} errors
 * @property {Array} warnings
 * @property {Object} outputs
 * @property {Array<string>} trace
 * @property {string} generatedAt
 */

export const ENGINEERING_TYPE_VERSION = "8.0.0";
