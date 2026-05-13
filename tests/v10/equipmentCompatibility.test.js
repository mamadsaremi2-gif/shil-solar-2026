import { EquipmentCompatibilityEngine } from "../../src/data/equipment/EquipmentCompatibilityEngine.js";
import { EquipmentDatabase } from "../../src/data/equipment/EquipmentDatabase.js";
import { defaultEquipmentSeed } from "../../src/data/equipment/defaultEquipmentSeed.js";
import { assert } from "../fixtures.js";

const db = new EquipmentDatabase(defaultEquipmentSeed);
const engine = new EquipmentCompatibilityEngine();

const ok = engine.checkSystem({
  pvModule: db.get("pv_generic_550"),
  inverter: db.get("inv_generic_5k_hybrid"),
  battery: db.get("bat_generic_lfp_51_200"),
  seriesCount: 4,
  parallelCount: 2,
  minTempC: -5
});

assert(ok.compatible === true, "Compatible PV/inverter/battery setup should pass.");

const bad = engine.checkPVInverter({
  pvModule: db.get("pv_generic_550"),
  inverter: db.get("inv_generic_3k_offgrid"),
  seriesCount: 6,
  parallelCount: 1,
  minTempC: -10
});

assert(bad.compatible === false, "Bad PV/inverter voltage match should fail.");
assert(bad.issues.length > 0, "Compatibility engine should return issues.");

console.log("equipmentCompatibility.test passed");
