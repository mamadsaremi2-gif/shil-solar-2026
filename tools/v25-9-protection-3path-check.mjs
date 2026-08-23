// SHIL V25.9 - canonical three-path electrical/protection convergence QA
if (!globalThis.localStorage) {
  globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){}, clear(){} };
}

const { runLoadEngine } = await import('../src/core/calculation/loadEngine.js');
const { protectionRule } = await import('../src/engine/rules/electrical/protection.rules.js');

const STANDARD_AMPS = [2,4,6,10,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600];
const CHANGEOVER_AMPS = [16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,630,800,1000,1250,1600];
const next = (list, value) => list.find((a) => a >= value) || Math.ceil(value / 100) * 100;
const approx = (a,b,tol=0.02) => Math.abs(Number(a)-Number(b)) <= tol;

function protectionFor(load) {
  const response = protectionRule.run({
    load,
    emergencyDesign: {
      load,
      inverter: { ratedPowerW: Math.max(6000, load.totalPowerW * 1.25), dcVoltage: 48, efficiency: 0.93 },
      battery: { packVoltage: 48, count: 1 },
    },
  }, {});
  return response?.values?.protection || response?.equipment?.protection || {};
}

function makeLoads(currentA, voltage=220) {
  const powerW = currentA * voltage;
  const common = { domain:'emergency', voltageAC:voltage, phaseAC:'single', backupHours:3 };
  return {
    current: runLoadEngine({ ...common, method:'current', manualCurrentA:currentA }),
    power: runLoadEngine({ ...common, method:'power', manualPowerW:powerW }),
    equipment: runLoadEngine({ ...common, method:'equipment', selectedItems:[{
      id:`qa-${currentA}`, title:'QA Resistive Load', ratedPowerW:powerW, quantity:1,
      simultaneityFactor:1, powerFactor:1, voltage, phase:'single', usageHoursPerDay:1,
    }] }),
  };
}

let failures = 0;
const rows = [];
const checkpoints = [9.5,10,10.1,15.5,16,16.1,19.5,20,20.1,24.5,25,25.1,31.5,32,32.1,39.5,40,40.1,49.5,50,50.1,62.5,63,63.1];

for (const requestedCurrent of checkpoints) {
  const loads = makeLoads(requestedCurrent);
  const expectedBreaker = next(STANDARD_AMPS, requestedCurrent);
  const expectedChangeover = next(CHANGEOVER_AMPS, requestedCurrent * 1.25);
  for (const [route, load] of Object.entries(loads)) {
    const p = protectionFor({
      totalPowerW: load.totalPowerW,
      totalCurrentA: load.acCurrentA,
      currentA: load.acCurrentA,
      voltageAC: load.voltageAC,
      phaseAC: load.phaseAC,
      powerFactor: load.powerFactorAC,
    });
    const breakerA = Number(p?.ac?.breakerA || p?.ac?.breakerSelection?.ratedCurrentA || 0);
    const changeoverA = Number(p?.ac?.changeoverA || 0);
    const exactCurrent = approx(load.acCurrentA, requestedCurrent);
    const pass = exactCurrent && breakerA === expectedBreaker && changeoverA === expectedChangeover;
    if (!pass) failures += 1;
    rows.push({ requestedCurrent, route, loadCurrent:load.acCurrentA, breakerA, expectedBreaker, changeoverA, expectedChangeover, pass });
  }
}

// Explicit user reference case: 3000 W / 220 V.
const referenceCurrent = 3000 / 220;
const referenceLoad = runLoadEngine({domain:'emergency', method:'power', voltageAC:220, phaseAC:'single', manualPowerW:3000, backupHours:3});
const referenceProtection = protectionFor({totalPowerW:referenceLoad.totalPowerW,totalCurrentA:referenceLoad.acCurrentA,currentA:referenceLoad.acCurrentA,voltageAC:220,phaseAC:'single'});
const refBreaker = Number(referenceProtection?.ac?.breakerA || referenceProtection?.ac?.breakerSelection?.ratedCurrentA || 0);
const refRcbo = Number(referenceProtection?.ac?.residualProtection?.ratedCurrentA || 0);
const refSensitivity = Number(referenceProtection?.ac?.residualProtection?.sensitivityMA || 0);
const refChangeover = Number(referenceProtection?.ac?.changeoverA || 0);
const refSpd = String(referenceProtection?.ac?.spdSelection?.spdType || referenceProtection?.ac?.spd || '');
const referencePass = approx(referenceLoad.acCurrentA, referenceCurrent) && refBreaker === 16 && refRcbo === 16 && refSensitivity === 30 && refChangeover === 20 && /T2|Type II/i.test(refSpd);
if (!referencePass) failures += 1;

console.log('\nSHIL V25.9 THREE-PATH PROTECTION QA');
console.table(rows);
console.log('Reference 3000W/220V:', { currentA:referenceLoad.acCurrentA, breakerA:refBreaker, rcboA:refRcbo, sensitivityMA:refSensitivity, changeoverA:refChangeover, spd:refSpd, pass:referencePass });

if (failures) {
  console.error(`\nFAIL: ${failures} three-path protection checks failed.`);
  process.exit(1);
}
console.log(`\nPASS: ${rows.length + 1} checks. Current, power and equipment routes converge at all tested rating boundaries.`);
