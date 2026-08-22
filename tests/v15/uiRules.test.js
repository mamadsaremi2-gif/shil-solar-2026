import { SHIL_UI_V15_RULES } from "../../src/ui/v15/uiRules.js";
function assert(c, m) { if (!c) throw new Error(m); }

assert(SHIL_UI_V15_RULES.identity.financialBlocksAllowed === false, "Financial UI disabled");
assert(SHIL_UI_V15_RULES.scroll.globalHorizontalScroll === false, "Global horizontal scroll forbidden");
assert(SHIL_UI_V15_RULES.blocks.raised === true, "Blocks elevated");
assert(SHIL_UI_V15_RULES.inputs.acceptsPersianDigits === true, "Persian digits supported");
assert(SHIL_UI_V15_RULES.finalOutput.integratedMpptInsideInverter === true, "MPPT integrated");

console.log("V15 UI rules test passed");
