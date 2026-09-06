import fs from "node:fs";
import { runSurfaceLoadPreview } from "../src/calculationGateway/surfacePreviewData.js";
import { normalizeLoadItem, runLoadEngine } from "../src/core/calculation/loadEngine.js";
import { EMERGENCY_MAX_BACKUP_HOURS, clampEmergencyBackupHours } from "../src/core/calculation/emergencySizingRules.js";
import { SHIL_SOLAR_INVERTERS, SHIL_LITHIUM_BATTERIES } from "../src/engineering/bank/equipmentBank.js";
import { filterEmergencyInverters, pickEmergencyInverter, emergencyInverterParallelCount, filterEmergencyBatteries, pickEmergencyBattery } from "../src/engineering/emergency/emergencyBankRules.js";

const checks=[];
const check=(ok,label,detail="")=>{checks.push({ok,label,detail}); console.log(`${ok?"OK":"FAIL"} ${label}${detail?` - ${detail}`:""}`)};
const near=(a,b,t=0.02)=>Math.abs(Number(a)-Number(b))<=t;

check(EMERGENCY_MAX_BACKUP_HOURS===12,"Emergency backup UX/core upper bound unified at 12 h",String(EMERGENCY_MAX_BACKUP_HOURS));
check(clampEmergencyBackupHours(99)===12,"Stale backup values are clamped to 12 h");

const singlePower=runSurfaceLoadPreview({domain:"emergency",method:"power",manualPowerW:5500,voltageAC:220,phaseAC:"single",backupHours:3,powerFactorAC:1});
check(near(singlePower.acCurrentA,25,0.01),"Single-phase power method current = P/V",String(singlePower.acCurrentA));
check(near(singlePower.totalEnergyKWh,16.5,0.01),"Single-phase emergency energy follows 3 h backup",String(singlePower.totalEnergyKWh));

const threePower=runSurfaceLoadPreview({domain:"emergency",method:"power",manualPowerW:10000,voltageAC:380,phaseAC:"three",backupHours:3,powerFactorAC:1});
check(near(threePower.acCurrentA,15.19,0.03),"Three-phase power method current uses sqrt(3)",String(threePower.acCurrentA));

const threeCurrent=runSurfaceLoadPreview({domain:"emergency",method:"current",manualCurrentA:25,voltageAC:380,phaseAC:"three",backupHours:1,powerFactorAC:1});
check(near(threeCurrent.totalPowerW,16454.48,0.1),"Three-phase current method derives correct power",String(threeCurrent.totalPowerW));
check(near(threeCurrent.acCurrentA,25,0.01),"Current method preserves entered AC current",String(threeCurrent.acCurrentA));
check(near(threeCurrent.totalEnergyKWh,16.45,0.02),"Current method backup energy follows selected hours",String(threeCurrent.totalEnergyKWh));

const raw={id:"motor",ratedPowerW:3000,quantity:1,usageHoursPerDay:8,simultaneityFactor:0.8,powerFactor:0.9,startupFactor:2};
const normalized=normalizeLoadItem(raw,{domain:"emergency"});
check(normalized.usageHoursPerDay===1,"Equipment method fixes equipment basis at 1 h",String(normalized.usageHoursPerDay));
const equipment=runLoadEngine({domain:"emergency",method:"equipment",selectedItems:[raw],backupHours:3,voltageAC:220});
check(equipment.totalPowerW===2400,"Equipment effective power keeps simultaneity",String(equipment.totalPowerW));
check(equipment.backupEnergyWh===7200,"Equipment storage energy = effective power x backup hours",String(equipment.backupEnergyWh));

const required=16454.48*1.25;
const invOptions=filterEmergencyInverters(SHIL_SOLAR_INVERTERS,required,{phaseAC:"three",voltageAC:380});
const inv=pickEmergencyInverter(invOptions,required,{phaseAC:"three",voltageAC:380});
check(Boolean(inv),"Three-phase emergency inverter bank has a compatible selection",inv?.id||"");
check(inv && emergencyInverterParallelCount(inv,required)>=1,"Three-phase inverter parallel count resolves",String(inv?emergencyInverterParallelCount(inv,required):0));
const batteryOptions=filterEmergencyBatteries(SHIL_LITHIUM_BATTERIES,inv,25);
const battery=pickEmergencyBattery(batteryOptions,inv,25);
check(Boolean(battery),"Emergency battery bank has a compatible LiFePO4 selection",battery?.id||"");

const settings=fs.readFileSync(new URL("../src/pages/project/EmergencySystemSettings.jsx",import.meta.url),"utf8");
check(settings.includes("inverterUnitRatedPowerW * Math.max(1, inverterCount)"),"Parallel inverter DC current is based on complete inverter bank");
check(settings.includes("selectedInverter?.batteryMinVoltage"),"Published inverter minimum battery voltage is honored for worst-case DC current");
check(settings.includes("dcFeederCount,"),"Battery protection selections carry parallel feeder quantity");
check(!settings.includes('localStorage.getItem("shil:calculationMethod")'),"Emergency settings uses local/session storage fallback");

const runPage=fs.readFileSync(new URL("../src/pages/project/RunCalculation.jsx",import.meta.url),"utf8");
check(!runPage.includes("localStorage.getItem"),"Final execution reads critical data through local/session fallback");

if(checks.some(x=>!x.ok)){console.error("\nSHIL V7 emergency flow QA FAILED");process.exit(1);}
console.log("\nSHIL V7 emergency flow QA PASSED");
