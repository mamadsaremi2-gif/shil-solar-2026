import { normalizeDigits, normalizeEngineeringInput, parseEngineeringNumber } from "../../src/ui/v15/inputNormalizer.js";
function assert(c, m) { if (!c) throw new Error(m); }

assert(normalizeDigits("۱۲۳") === "123", "Persian digits normalize");
assert(normalizeDigits("١٢٣") === "123", "Arabic digits normalize");
assert(normalizeEngineeringInput("  ۵ kw  ") === "5 kW", "Engineering input normalizes");
assert(parseEngineeringNumber("۵۰.۵ kW") === 50.5, "Engineering number parses");

console.log("V15 input normalizer test passed");
