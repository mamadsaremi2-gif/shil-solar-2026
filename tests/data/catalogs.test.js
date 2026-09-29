import { createValidOffgridFixture, assert } from "../fixtures.js";
import { applyCatalogSelection, catalogService } from "../../src/data/catalogs/catalogService.js";

const form = createValidOffgridFixture();
const next = applyCatalogSelection(form, {
  pvModuleId: "pv_550_mono_generic",
  inverterId: "shil-hi-6kw-48v",
  batteryId: "shil-lfp-51-2-200",
  climateCityId: "ir_shiraz"
});

assert(catalogService.pvModules().length >= 2, "PV catalog should expose modules.");
assert(next.pv.panelPowerW === 550, "Catalog selection should apply PV module.");
assert(next.inverter.ratedPowerW === 6000, "Catalog selection should apply inverter.");
assert(next.battery.nominalVoltage === 51.2, "Catalog selection should apply battery.");
assert(next.environment.peakSunHours === 5.6, "Catalog selection should apply climate city.");

console.log("catalogs.test passed");
