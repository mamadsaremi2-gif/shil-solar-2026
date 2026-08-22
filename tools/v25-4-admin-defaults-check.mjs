import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const admin=read('src/pages/AdminDashboard.jsx');
const store=read('src/admin/adminStore.js');
const css=read('src/styles/shil-admin-path-defaults-v254.css');
const checks=[
 ['دو مسیر پیش فرض', admin.includes('پیش‌فرض‌های خورشیدی') && admin.includes('پیش‌فرض‌های برق اضطراری')],
 ['هشت مرحله مهندسی', ['path','info','environment','method','inputs','system','summary','run'].every(k=>admin.includes(`key: "${k}"`))],
 ['آکاردئون مراحل', admin.includes('shil-default-stage-v254') && admin.includes('<details key={step.key}')],
 ['برق اضطراری 1 تا 24', admin.includes('min="1" max="24"') && admin.includes('ساعت مبنای همه مصرف‌کننده‌ها ثابت و برابر ۱ ساعت')],
 ['Runtime admin defaults', store.includes('saveRuntimeAppData(RUNTIME_KEYS.adminDefaults, saved)')],
 ['گرادیان آبی', css.includes('linear-gradient') && !/purple|violet|#7c3aed|#8b5cf6/i.test(css)],
 ['موبایل دو ستونه', css.includes('grid-template-columns:repeat(2,minmax(0,1fr))')],
];
let ok=true; for(const [name,pass] of checks){console.log(`${pass?'OK':'FAIL'} ${name}`); if(!pass) ok=false;} if(!ok) process.exit(1); console.log('SHIL V25.4 admin defaults static QA passed.');
