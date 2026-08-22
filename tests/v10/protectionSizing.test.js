import { runProtectionSizing, sizePVStringFuse, sizeDCBreaker, sizeACBreaker, sizeSPD } from "../../src/protection/ProtectionSizingEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const form = createValidOffgridFixture();
const fuse = sizePVStringFuse(form);
const dc = sizeDCBreaker(form);
const ac = sizeACBreaker(form);
const spd = sizeSPD(form);
const all = runProtectionSizing(form);

assert(fuse.selectedA >= fuse.requiredA, "PV fuse should be selected above required current.");
assert(dc.selectedA >= dc.requiredA, "DC breaker should be selected above required current.");
assert(ac.selectedA >= ac.requiredA, "AC breaker should be selected above required current.");
assert(spd.selectedDcSPDVoltageV >= spd.requiredDcVoltageV, "SPD DC voltage should cover required voltage.");
assert(all.pvStringFuse && all.dcBreaker && all.acBreaker && all.spd, "Protection engine should return all protection items.");

console.log("protectionSizing.test passed");
