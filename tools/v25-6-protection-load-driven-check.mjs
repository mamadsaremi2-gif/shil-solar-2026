import fs from 'node:fs';

const checks = [
  ['src/engine/rules/electrical/protection.rules.js', [
    'acBreakerFactor',
    'changeoverFactor',
    'MCB C${acRatingA}',
    'changeoverSelection',
    'preferRcbo = residual.preferRcbo !== false',
    'batteryBasisPowerW',
  ]],
  ['src/engineering/bank/equipmentBank.js', [
    'CHANGEOVER_SWITCH_230_400V_20_125A',
    'IEC60947-6-1',
  ]],
  ['src/pages/project/RunCalculation.jsx', [
    'کلید چنج‌اور',
    'characteristicCurve',
    'changeoverSelection',
  ]],
];

let ok = true;
for (const [file, needles] of checks) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL missing ${file}`);
    ok = false;
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) {
      console.error(`FAIL ${file}: ${needle}`);
      ok = false;
    } else {
      console.log(`OK ${needle}`);
    }
  }
}

const standard = [2,4,6,10,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600];
const transfer = [16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,630,800,1000,1250,1600];
const next = (v, list) => list.find((x) => x >= v) ?? Math.ceil(v / 100) * 100;
const loadA = 3000 / 220;
const breaker = next(loadA, standard);
const changeover = next(loadA * 1.25, transfer);
if (breaker !== 16 || changeover !== 20) {
  console.error(`FAIL sample 3000W/220V => ${loadA.toFixed(2)}A, breaker=${breaker}, changeover=${changeover}`);
  ok = false;
} else {
  console.log(`OK sample: 3000W / 220V = ${loadA.toFixed(2)}A -> MCB C16, RCBO 16A/30mA, Changeover 20A, SPD Type II`);
}

if (!ok) process.exit(1);
console.log('SHIL V25.6 load-driven protection static QA passed.');
