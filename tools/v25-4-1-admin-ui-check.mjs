import fs from 'node:fs';
const read = p => fs.readFileSync(p,'utf8');
const admin = read('src/pages/AdminDashboard.jsx');
const main = read('src/main.jsx');
const css = read('src/styles/shil-admin-v2541-ui-refinement.css');
const checks = [
  ['short solar entry', admin.includes('<strong>خورشیدی</strong><span>پیش‌فرض‌های مسیر</span>')],
  ['short emergency entry', admin.includes('<strong>برق اضطراری</strong><span>پیش‌فرض‌های مسیر</span>')],
  ['compact path header', admin.includes('☀ پیش‌فرض‌های خورشیدی · ۸ مرحله') && admin.includes('⚡ پیش‌فرض‌های برق اضطراری · ۸ مرحله')],
  ['closed cards title only', !admin.includes('<small>{step.note}</small>')],
  ['compact actions', admin.includes('>ذخیره</button>') && admin.includes('>انتشار</button>') && admin.includes('>بازنشانی</button>')],
  ['stylesheet imported last', main.includes('shil-admin-path-defaults-v254.css";\nimport "./styles/shil-admin-v2541-ui-refinement.css";')],
  ['legacy purple neutralized', css.includes('Kill legacy purple/indigo surfaces across Admin') && css.includes('.shil-admin-module-card-v10')],
  ['compact stage layout', css.includes('min-height:58px!important')],
  ['footer safe area', css.includes('env(safe-area-inset-bottom,0px)')],
  ['three column action bar', css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important')],
];
let failed=0;
for (const [label,ok] of checks){ console.log(`${ok?'OK':'FAIL'} ${label}`); if(!ok) failed++; }
if(failed){console.error(`SHIL V25.4.1 UI QA failed: ${failed}`); process.exit(1)}
console.log('SHIL V25.4.1 Admin UI static QA passed.');
