import fs from 'node:fs';

const checks = [
  ['src/pages/LoginPage.jsx', 'shil:remember-login', 'remember-login state'],
  ['src/pages/LoginPage.jsx', 'autoComplete="current-password"', 'password-manager autocomplete'],
  ['src/data/catalogs/consumerEquipmentLibrary.js', 'CONSUMER_CATEGORY_ORDER', 'consumer taxonomy'],
  ['src/pages/project/CalculationInputs.jsx', 'shil-equipment-category', 'user equipment category accordion'],
  ['src/pages/AdminDashboard.jsx', 'shil-admin-consumer-category', 'admin consumer category accordion'],
  ['src/pages/AdminDashboard.jsx', 'shil-admin-cms-subcategory', 'technical equipment subcategories'],
  ['src/pages/AdminDashboard.jsx', 'sortedAdminProjects', 'newest project ordering'],
  ['src/pages/AdminDashboard.jsx', 'انتقال به سناریوهای آماده', 'project-to-ready-scenario action'],
  ['src/pages/AdminDashboard.jsx', 'ذخیره PDF', 'project save PDF action'],
  ['src/pages/AdminDashboard.jsx', 'انتقال / اشتراک', 'project share action'],
  ['src/data/scenarios/adminReadyScenarioLibrary.js', 'publishProjectAsReadyScenario', 'ready-scenario runtime publisher'],
  ['src/pages/Scenarios.jsx', 'loadAdminReadyScenarios', 'ready-scenario user loader'],
  ['src/services/runtimeAppDataService.js', 'readyScenarios: "ready_scenarios"', 'runtime ready_scenarios key'],
  ['src/export/shilExportSystem.js', 'exportElementAsMultiPagePdf', 'multi-page project PDF'],
  ['supabase/SHIL_V25_2_STAGE1_READY_SCENARIOS.sql', "'ready_scenarios'", 'Supabase read policy migration'],
];

let failed = 0;
for (const [file, token, label] of checks) {
  const ok = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(token);
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) {
  console.error(`\nV25.2 Stage 1 check failed: ${failed} item(s).`);
  process.exit(1);
}
console.log('\nSHIL V25.2 Stage 1 static gate passed.');
