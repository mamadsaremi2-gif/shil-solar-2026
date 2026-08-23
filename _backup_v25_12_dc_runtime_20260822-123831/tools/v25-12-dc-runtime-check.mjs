import fs from "node:fs";

const file = "src/pages/project/EmergencySystemSettings.jsx";
const run = "src/pages/project/RunCalculation.jsx";
const a = fs.readFileSync(file, "utf8");
const b = fs.readFileSync(run, "utf8");
const checks = [
  ["blank values use fallback", a.includes('if (normalized === "") return Number(fallback) || 0;')],
  ["inverter power resolver", a.includes("resolveInverterRatedPowerW")],
  ["battery bus resolver", a.includes("resolveBatteryBusVoltageV")],
  ["DC current uses inverter power", a.includes("inverterRatedPowerW / minBatteryVoltageV / inverterEfficiency")],
  ["battery fuse catalog gated", a.includes("batteryBus: true")],
  ["DC overflow exposed", a.includes("dcProtectionRangeExceeded")],
  ["IEC coordination explicit", a.includes("dcCoordinationPass")],
  ["RCBO 30 mA explicit", a.includes("RCBO Type A | ${acBreakerA} A | 30 mA")],
  ["output prefers operating DC current", b.includes("batteryNested?.operatingCurrentA")],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? "OK" : "FAIL"} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
console.log("SHIL V25.12 DC runtime static QA passed.");
