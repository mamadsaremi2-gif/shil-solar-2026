import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'src');
const write = (file, content) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, 'utf8'); };

// 1) Canonical engine shell. No calculation rules are active here.
write(path.join(src, 'engine', 'core', 'runRules.js'), `// SHIL clean rule runner\n// Single entry point for future engineering rules.\n// Current state: intentionally passive. Pages must not run calculation logic directly.\n\nimport { ruleRegistry } from '../rules/index.js';\nimport { validateRuleInput } from '../validation/validateRuleInput.js';\nimport { createRuleTrace } from '../debug/ruleTrace.js';\n\nexport function runRules(input = {}, options = {}) {\n  const trace = createRuleTrace('runRules');\n  const safeInput = validateRuleInput(input);\n  const enabledRules = options.enabledRules || [];\n\n  const results = {\n    ok: true,\n    mode: 'PASSIVE_ENGINE',\n    input: safeInput,\n    equipment: safeInput.equipment || {},\n    warnings: [],\n    explanations: [],\n    appliedRules: [],\n    trace: trace.finish(),\n  };\n\n  for (const ruleName of enabledRules) {\n    const rule = ruleRegistry[ruleName];\n    if (!rule || typeof rule.run !== 'function') {\n      results.warnings.push({ code: 'RULE_NOT_FOUND', ruleName });\n      continue;\n    }\n\n    try {\n      const ruleResult = rule.run(safeInput, results);\n      results.appliedRules.push(ruleName);\n      if (ruleResult && typeof ruleResult === 'object') {\n        Object.assign(results, ruleResult);\n      }\n    } catch (error) {\n      results.ok = false;\n      results.warnings.push({ code: 'RULE_RUNTIME_ERROR', ruleName, message: error?.message || String(error) });\n    }\n  }\n\n  return results;\n}\n\nexport default runRules;\n`);

write(path.join(src, 'engine', 'rules', 'index.js'), `// Central rules registry for SHIL.\n// Add future rules here only. Do not place rule logic inside pages/components.\n\nexport const ruleRegistry = Object.freeze({\n  // voltage: voltageRule,\n  // protection: protectionRule,\n  // mppt: mpptRule,\n});\n\nexport const ruleGroups = Object.freeze({\n  systemSettings: [],\n  finalCalculation: [],\n  report: [],\n});\n`);

write(path.join(src, 'engine', 'validation', 'validateRuleInput.js'), `export function validateRuleInput(input) {\n  if (!input || typeof input !== 'object' || Array.isArray(input)) {\n    return {};\n  }\n\n  return {\n    ...input,\n    project: input.project || {},\n    environment: input.environment || {},\n    equipment: input.equipment || {},\n    userInputs: input.userInputs || {},\n  };\n}\n`);

write(path.join(src, 'engine', 'debug', 'ruleTrace.js'), `export function createRuleTrace(scope = 'engine') {\n  const startedAt = Date.now();\n  const events = [];\n\n  return {\n    add(event, payload = {}) {\n      events.push({ event, payload, at: Date.now() });\n    },\n    finish() {\n      return { scope, durationMs: Date.now() - startedAt, events };\n    },\n  };\n}\n`);

write(path.join(src, 'engine', 'index.js'), `export { runRules } from './core/runRules.js';\nexport { ruleRegistry, ruleGroups } from './rules/index.js';\n`);

// 2) Canonical data registry.
write(path.join(src, 'data', 'registry', 'equipmentRegistry.js'), `// Central equipment registry.\n// Future panel/battery/inverter data should be imported here and exposed through stable getters.\n\nexport const equipmentRegistry = Object.freeze({\n  panels: [],\n  batteries: [],\n  inverters: [],\n  protections: [],\n  cables: [],\n});\n\nexport function getEquipmentBank(type) {\n  return equipmentRegistry[type] || [];\n}\n`);
write(path.join(src, 'data', 'registry', 'index.js'), `export { equipmentRegistry, getEquipmentBank } from './equipmentRegistry.js';\n`);

// 3) Module partition wrappers. They keep current files in place but give every feature a stable boundary.
const modules = {
  auth: {
    files: {
      'pages/LoginPage.jsx': `export { default } from '../../../pages/LoginPage.jsx';\n`,
      'pages/WelcomePage.jsx': `export { default } from '../../../pages/WelcomePage.jsx';\n`,
      'index.js': `export { default as LoginPage } from './pages/LoginPage.jsx';\nexport { default as WelcomePage } from './pages/WelcomePage.jsx';\n`,
      'README.md': `# Auth Partition\n\nOwns login and welcome flow. UI is currently re-exported from legacy pages to avoid breaking imports.\n`,
    }
  },
  admin: {
    files: {
      'pages/AdminDashboard.jsx': `export { default } from '../../../pages/AdminDashboard.jsx';\n`,
      'index.js': `export { default as AdminDashboard } from './pages/AdminDashboard.jsx';\n`,
      'README.md': `# Admin Partition\n\nOwns admin panel screens, stores, and future admin services.\n`,
    }
  },
  dashboard: {
    files: {
      'pages/Dashboard.jsx': `export { default } from '../../../pages/Dashboard.jsx';\n`,
      'index.js': `export { default as Dashboard } from './pages/Dashboard.jsx';\n`,
      'README.md': `# Dashboard Partition\n\nOwns main dashboard tiles, navigation cards, and dashboard-only state.\n`,
    }
  },
  projects: {
    files: {
      'pages/Projects.jsx': `export { default } from '../../../pages/Projects.jsx';\n`,
      'index.js': `export { default as Projects } from './pages/Projects.jsx';\n`,
      'README.md': `# Projects Partition\n\nOwns project list, running/final/archived project views, and project cards.\n`,
    }
  },
  'new-project': {
    files: {
      'pages/NewProject.jsx': `export { default } from '../../../pages/NewProject.jsx';\n`,
      'pages/ProjectInfo.jsx': `export { default } from '../../../pages/project/ProjectInfo.jsx';\n`,
      'pages/Environment.jsx': `export { default } from '../../../pages/project/Environment.jsx';\n`,
      'pages/ProjectPath.jsx': `export { default } from '../../../pages/project/ProjectPath.jsx';\n`,
      'pages/SolarSystemType.jsx': `export { default } from '../../../pages/project/SolarSystemType.jsx';\n`,
      'pages/CalculationMethod.jsx': `export { default } from '../../../pages/project/CalculationMethod.jsx';\n`,
      'pages/CalculationInputs.jsx': `export { default } from '../../../pages/project/CalculationInputs.jsx';\n`,
      'pages/ExecutionMethod.jsx': `export { default } from '../../../pages/project/ExecutionMethod.jsx';\n`,
      'pages/SystemSettings.jsx': `export { default } from '../../../pages/project/SystemSettings.jsx';\n`,
      'pages/SummaryPage.jsx': `export { default } from '../../../pages/project/SummaryPage.jsx';\n`,
      'pages/RunCalculation.jsx': `export { default } from '../../../pages/project/RunCalculation.jsx';\n`,
      'pages/UnderDevelopment.jsx': `export { default } from '../../../pages/project/UnderDevelopment.jsx';\n`,
      'services/projectEngineGateway.js': `import { runRules } from '../../../engine/index.js';\n\nexport function getProjectEngineResult(input = {}, options = {}) {\n  return runRules(input, options);\n}\n`,
      'index.js': `export { default as NewProject } from './pages/NewProject.jsx';\nexport { default as ProjectInfo } from './pages/ProjectInfo.jsx';\nexport { default as Environment } from './pages/Environment.jsx';\nexport { default as ProjectPath } from './pages/ProjectPath.jsx';\nexport { default as SolarSystemType } from './pages/SolarSystemType.jsx';\nexport { default as CalculationMethod } from './pages/CalculationMethod.jsx';\nexport { default as CalculationInputs } from './pages/CalculationInputs.jsx';\nexport { default as ExecutionMethod } from './pages/ExecutionMethod.jsx';\nexport { default as SystemSettings } from './pages/SystemSettings.jsx';\nexport { default as SummaryPage } from './pages/SummaryPage.jsx';\nexport { default as RunCalculation } from './pages/RunCalculation.jsx';\nexport { default as UnderDevelopment } from './pages/UnderDevelopment.jsx';\n`,
      'README.md': `# New Project Partition\n\nOwns the complete new-project wizard from project info to summary/run calculation.\n\nRule execution must go through services/projectEngineGateway.js, which currently calls the passive central engine.\n`,
    }
  },
  contact: {
    files: {
      'pages/Contact.jsx': `export { default } from '../../../pages/Contact.jsx';\n`,
      'index.js': `export { default as Contact } from './pages/Contact.jsx';\n`,
      'README.md': `# Contact Partition\n\nOwns contact/support/catalog screens.\n`,
    }
  },
  feedback: {
    files: {
      'pages/Feedback.jsx': `export { default } from '../../../pages/Feedback.jsx';\n`,
      'index.js': `export { default as Feedback } from './pages/Feedback.jsx';\n`,
      'README.md': `# Feedback Partition\n\nOwns feedback screens and future feedback services.\n`,
    }
  },
  scenarios: {
    files: {
      'pages/Scenarios.jsx': `export { default } from '../../../pages/Scenarios.jsx';\n`,
      'index.js': `export { default as Scenarios } from './pages/Scenarios.jsx';\n`,
      'README.md': `# Scenarios Partition\n\nOwns ready scenario views and scenario browsing.\n`,
    }
  },
  assistant: {
    files: {
      'pages/Assistant.jsx': `export { default } from '../../../pages/Assistant.jsx';\n`,
      'pages/Education.jsx': `export { default } from '../../../pages/Education.jsx';\n`,
      'index.js': `export { default as Assistant } from './pages/Assistant.jsx';\nexport { default as Education } from './pages/Education.jsx';\n`,
      'README.md': `# Assistant Partition\n\nOwns AI assistant and education screens.\n`,
    }
  },
  common: {
    files: {
      'pages/NotFoundPage.jsx': `export { default } from '../../../pages/NotFoundPage.jsx';\n`,
      'index.js': `export { default as NotFoundPage } from './pages/NotFoundPage.jsx';\n`,
      'README.md': `# Common Partition\n\nOwns shared fallback pages and cross-module UI boundaries.\n`,
    }
  }
};

for (const [name, module] of Object.entries(modules)) {
  for (const [file, content] of Object.entries(module.files)) {
    write(path.join(src, 'modules', name, file), content);
  }
}

// 4) Update App imports to use partitions.
const appFile = path.join(src, 'app', 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');
const replacements = [
  [`const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));`, `const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage.jsx"));`],
  [`const WelcomePage = lazy(() => import("../pages/WelcomePage.jsx"));`, `const WelcomePage = lazy(() => import("../modules/auth/pages/WelcomePage.jsx"));`],
  [`const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));`, `const Dashboard = lazy(() => import("../modules/dashboard/pages/Dashboard.jsx"));`],
  [`const AdminDashboard = lazy(() => import("../pages/AdminDashboard.jsx"));`, `const AdminDashboard = lazy(() => import("../modules/admin/pages/AdminDashboard.jsx"));`],
  [`const NewProject = lazy(() => import("../pages/NewProject.jsx"));`, `const NewProject = lazy(() => import("../modules/new-project/pages/NewProject.jsx"));`],
  [`const Projects = lazy(() => import("../pages/Projects.jsx"));`, `const Projects = lazy(() => import("../modules/projects/pages/Projects.jsx"));`],
  [`const Contact = lazy(() => import("../pages/Contact.jsx"));`, `const Contact = lazy(() => import("../modules/contact/pages/Contact.jsx"));`],
  [`const Feedback = lazy(() => import("../pages/Feedback.jsx"));`, `const Feedback = lazy(() => import("../modules/feedback/pages/Feedback.jsx"));`],
  [`const Scenarios = lazy(() => import("../pages/Scenarios.jsx"));`, `const Scenarios = lazy(() => import("../modules/scenarios/pages/Scenarios.jsx"));`],
  [`const Assistant = lazy(() => import("../pages/Assistant.jsx"));`, `const Assistant = lazy(() => import("../modules/assistant/pages/Assistant.jsx"));`],
  [`const Education = lazy(() => import("../pages/Education.jsx"));`, `const Education = lazy(() => import("../modules/assistant/pages/Education.jsx"));`],
  [`const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));`, `const NotFoundPage = lazy(() => import("../modules/common/pages/NotFoundPage.jsx"));`],
  [`const ProjectInfo = lazy(() => import("../pages/project/ProjectInfo.jsx"));`, `const ProjectInfo = lazy(() => import("../modules/new-project/pages/ProjectInfo.jsx"));`],
  [`const Environment = lazy(() => import("../pages/project/Environment.jsx"));`, `const Environment = lazy(() => import("../modules/new-project/pages/Environment.jsx"));`],
  [`const ProjectPath = lazy(() => import("../pages/project/ProjectPath.jsx"));`, `const ProjectPath = lazy(() => import("../modules/new-project/pages/ProjectPath.jsx"));`],
  [`const SolarSystemType = lazy(() => import("../pages/project/SolarSystemType.jsx"));`, `const SolarSystemType = lazy(() => import("../modules/new-project/pages/SolarSystemType.jsx"));`],
  [`const CalculationMethod = lazy(() => import("../pages/project/CalculationMethod.jsx"));`, `const CalculationMethod = lazy(() => import("../modules/new-project/pages/CalculationMethod.jsx"));`],
  [`const CalculationInputs = lazy(() => import("../pages/project/CalculationInputs.jsx"));`, `const CalculationInputs = lazy(() => import("../modules/new-project/pages/CalculationInputs.jsx"));`],
  [`const ExecutionMethod = lazy(() => import("../pages/project/ExecutionMethod.jsx"));`, `const ExecutionMethod = lazy(() => import("../modules/new-project/pages/ExecutionMethod.jsx"));`],
  [`const SystemSettings = lazy(() => import("../pages/project/SystemSettings.jsx"));`, `const SystemSettings = lazy(() => import("../modules/new-project/pages/SystemSettings.jsx"));`],
  [`const SummaryPage = lazy(() => import("../pages/project/SummaryPage.jsx"));`, `const SummaryPage = lazy(() => import("../modules/new-project/pages/SummaryPage.jsx"));`],
  [`const RunCalculation = lazy(() => import("../pages/project/RunCalculation.jsx"));`, `const RunCalculation = lazy(() => import("../modules/new-project/pages/RunCalculation.jsx"));`],
  [`const UnderDevelopment = lazy(() => import("../pages/project/UnderDevelopment.jsx"));`, `const UnderDevelopment = lazy(() => import("../modules/new-project/pages/UnderDevelopment.jsx"));`],
];
for (const [from, to] of replacements) app = app.replace(from, to);
fs.writeFileSync(appFile, app, 'utf8');

// 5) Architecture map.
write(path.join(root, 'CLEAN_ARCHITECTURE_MAP.md'), `# SHIL Clean Partition Map\n\n## Runtime principle\n\nUI pages do not contain engineering rules. Any future calculation must pass through:\n\n\`src/engine/core/runRules.js\`\n\nRules are registered only in:\n\n\`src/engine/rules/index.js\`\n\n## Feature partitions\n\n- \`src/modules/auth\`: login and welcome\n- \`src/modules/admin\`: admin panel\n- \`src/modules/dashboard\`: dashboard\n- \`src/modules/projects\`: project list / running / final / archived\n- \`src/modules/new-project\`: full new-project wizard\n- \`src/modules/contact\`: contact/support\n- \`src/modules/feedback\`: feedback\n- \`src/modules/scenarios\`: ready scenarios\n- \`src/modules/assistant\`: assistant and education\n- \`src/modules/common\`: fallback/shared pages\n\n## Data\n\nShared future equipment data starts from:\n\n\`src/data/registry\`\n\n## Current compatibility layer\n\nTo avoid breaking the app, module pages currently re-export legacy page files under \`src/pages\`. Future cleanup can move each page's actual source into its module after each route is tested.\n\n## Rule rollout process\n\n1. Add one rule file under \`src/engine/rules\`.\n2. Register it in \`src/engine/rules/index.js\`.\n3. Enable it in the target group.\n4. Test only that group.\n5. Keep UI pages untouched.\n`);

console.log('Partition refactor applied safely.');
