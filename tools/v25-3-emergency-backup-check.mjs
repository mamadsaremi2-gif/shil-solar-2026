import fs from "node:fs";
import { normalizeLoadItem, runLoadEngine } from "../src/core/calculation/loadEngine.js";
import { clampEmergencyBackupHours } from "../src/core/calculation/emergencySizingRules.js";

const checks=[];
const check=(ok,label,detail="")=>{checks.push({ok,label,detail}); console.log(`${ok?"OK":"FAIL"} ${label}${detail?` - ${detail}`:""}`)};

const raw={id:"ac-30000",ratedPowerW:3000,quantity:1,usageHoursPerDay:8,simultaneityFactor:0.8,powerFactor:0.9,startupFactor:2};
const normalized=normalizeLoadItem(raw,{domain:"emergency"});
check(normalized.usageHoursPerDay===1,"Emergency equipment base hours fixed at 1",String(normalized.usageHoursPerDay));
check(normalized.effectivePowerW===2400,"Existing simultaneity factor preserved",String(normalized.effectivePowerW));
check(clampEmergencyBackupHours(undefined)===3,"Default backup time is 3 h");
check(clampEmergencyBackupHours(0)===1,"Backup lower bound is 1 h");
check(clampEmergencyBackupHours(30)===24,"Backup upper bound is 24 h");
const result=runLoadEngine({domain:"emergency",method:"equipment",selectedItems:[raw],backupHours:3,voltageAC:220});
check(result.totalPowerW===2400,"Inverter load basis uses effective power",String(result.totalPowerW));
check(result.baseLoadEnergyWh===2400,"Base load energy uses exactly 1 h",String(result.baseLoadEnergyWh));
check(result.backupHours===3,"Backup duration is separate from equipment hours",String(result.backupHours));
check(result.backupEnergyWh===7200,"Storage energy = effective power x backup hours",String(result.backupEnergyWh));

const calc=fs.readFileSync(new URL("../src/pages/project/CalculationInputs.jsx",import.meta.url),"utf8");
check(calc.includes('min={effectiveDomain === "emergency" ? EMERGENCY_MIN_BACKUP_HOURS'),"Emergency backup input has 1 h minimum");
check(calc.includes('max={effectiveDomain === "emergency" ? EMERGENCY_MAX_BACKUP_HOURS'),"Emergency backup input has 24 h maximum");
check(calc.includes('readOnly={effectiveDomain === "emergency"}'),"Per-equipment hour input is read-only in emergency route");

if(checks.some(x=>!x.ok)){console.error("\nSHIL V25.3 emergency sizing QA FAILED");process.exit(1);}
console.log("\nSHIL V25.3 emergency sizing QA PASSED");
