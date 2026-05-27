import { sizePVStrings } from "../../src/calculation/sizing/pvStringSizer.js";
import { sizeBatteryBank } from "../../src/calculation/sizing/batterySizer.js";
import { sizeInverter } from "../../src/calculation/sizing/inverterSizer.js";
import { sizeCable } from "../../src/calculation/sizing/cableSizer.js";
import { runSystemSizing } from "../../src/calculation/sizing/systemSizingEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const pv = sizePVStrings({
  panel: { powerW: 550, voc: 49.8, vmp: 41.8, tempCoeffVocPercentPerC: -0.28 },
  inverter: { maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450 },
  minTempC: -5,
  targetPowerW: 3000
});

assert(pv.length > 0, "PV string sizing should return candidates.");
assert(pv[0].series >= 3, "PV candidate should satisfy MPPT minimum.");

const battery = sizeBatteryBank({
  dailyEnergyWh: 12000,
  autonomyDays: 1,
  nominalVoltage: 48,
  depthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  moduleCapacityAh: 100
});

assert(battery.moduleCount >= 4, "Battery sizing should select enough modules.");

const inverter = sizeInverter({ peakLoadW: 2500 });
assert(inverter.selectedRatedPowerW >= inverter.requiredRatedPowerW, "Inverter sizing should select standard rating.");

const cable = sizeCable({ lengthM: 20, currentA: 40, systemVoltage: 48, crossSectionMm2: 16 });
assert(cable.withinLimit === true, "Cable sizing should find acceptable cross section.");

const system = runSystemSizing(createValidOffgridFixture());
assert(system.pv.recommended, "System sizing should recommend PV string.");
assert(system.battery.moduleCount > 0, "System sizing should size battery.");
assert(system.inverter.selectedRatedPowerW > 0, "System sizing should size inverter.");

console.log("sizingStrategies.test passed");
