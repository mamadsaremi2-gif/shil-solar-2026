import { EquipmentDatabase } from "../../src/data/equipment/EquipmentDatabase.js";
import { defaultEquipmentSeed } from "../../src/data/equipment/defaultEquipmentSeed.js";
import { assert } from "../fixtures.js";

const db = new EquipmentDatabase(defaultEquipmentSeed);

assert(db.list({ type: "pv" }).length >= 3, "Equipment DB should list PV modules.");
assert(db.search("Hybrid").length >= 1, "Equipment DB should search equipment.");
assert(db.validateItem("pv_generic_550").valid === true, "Equipment DB should validate PV module.");

db.add({ id: "bad_pv", type: "pv", manufacturer: "Bad", model: "Missing Values" });
assert(db.validateItem("bad_pv").valid === false, "Equipment DB should detect invalid equipment.");

console.log("equipmentDatabase.test passed");
