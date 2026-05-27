import fs from 'node:fs';

const criticalFiles = [
  'src/components/ShilPageShell.jsx',
  'src/components/ProjectMiniRail.jsx',
  'src/components/ProjectStepGuard.jsx',
  'src/pages/project/SystemSettings.jsx',
  'src/modules/new-project/pages/SystemSettings.jsx',
];

for (const file of criticalFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useNavigate(') || content.includes('useParams(') || content.includes('useLocation(')) {
    throw new Error(`${file}: critical system route still depends on router context hooks`);
  }
}

const app = fs.readFileSync('src/app/App.jsx', 'utf8');
if (!app.includes('<BrowserRouter>')) throw new Error('App.jsx: BrowserRouter missing');
if (!app.includes('<GlobalErrorBoundary>')) throw new Error('App.jsx: GlobalErrorBoundary missing');
if (!app.includes('/new-project/system/:domain')) throw new Error('App.jsx: system domain route missing');

console.log('SHIL V18 route/provider guard passed: critical system route no longer depends on fragile router-context hooks.');
