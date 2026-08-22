import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const admin=read('src/pages/AdminDashboard.jsx');
const main=read('src/main.jsx');
const css=read('src/styles/shil-v25-2-stage2-admin-ux.css');
const sql=read('supabase/SHIL_V25_2_STAGE2_ADMIN_RLS.sql');
const checks=[
 ['legacy admin v21 import removed', !admin.includes('shil-admin-v21-comprehensive.css')],
 ['project sections use nested details', admin.includes('<details className="shil-admin-project-report-section">')],
 ['project raw key labels localized', admin.includes('PROJECT_FIELD_LABELS') && admin.includes('projectFieldLabel')],
 ['project statuses localized', admin.includes('projectStatusLabel')],
 ['friendly cloud errors', admin.includes('friendlyAdminError')],
 ['scenario metadata sync is best effort', admin.includes('SHIL project scenario metadata sync')],
 ['stage2 stylesheet imported last', main.includes('shil-v25-2-stage2-admin-ux.css') && main.lastIndexOf('shil-v25-2-stage2-admin-ux.css') > main.lastIndexOf('shil-v25-2-stage1.css')],
 ['consumer toolbar overlap fix', css.includes('.shil-admin-cms-toolbar--sticky-add') && css.includes('position:relative!important')],
 ['equipment group compact layout', css.includes('.shil-admin-cms-group-head') && css.includes('grid-template-columns:minmax(0,1fr) 30px!important')],
 ['overview purple neutralized', css.includes('[style*="purple"]') && css.includes('background:var(--s252-card)!important')],
 ['admin runtime RLS repair', sql.includes('shil_app_data_admin_all_v252')],
 ['admin records RLS repair', sql.includes('shil_records_admin_all_v252')],
];
let fail=0;
for(const [name,ok] of checks){console.log(`${ok?'OK':'!!'} ${name}`); if(!ok) fail++;}
if(fail){console.error(`Stage 2 QA failed: ${fail}`); process.exit(1)}
console.log('SHIL V25.2 Stage 2 static QA passed.');
