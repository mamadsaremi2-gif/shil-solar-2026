export const APP_ROUTES = Object.freeze({
  root: "/",

  // Auth / shell
  login: "/login",
  auth: "/login",
  welcome: "/welcome",
  dashboard: "/dashboard",
  admin: "/admin",

  // New project flow
  newProject: "/new-project",
  projectInfo: "/new-project/info",
  environment: "/new-project/environment",
  environmentDomain: "/new-project/environment/:domain",
  projectPath: "/new-project/path",
  solarSelect: "/new-project/solar/select",
  solarConnection: "/new-project/solar/:connection",
  solarOffgrid: "/new-project/solar/offgrid",
  solarHybrid: "/new-project/solar/hybrid",
  solarOngrid: "/new-project/solar/ongrid",
  emergency: "/new-project/emergency",
  calculationMethod: "/new-project/method",
  inputDomainMethod: "/new-project/input/:domain/:method",
  inputsDomain: "/new-project/inputs/:domain",
  inputs: "/new-project/inputs",
  executionDomain: "/new-project/execution/:domain",
  execution: "/new-project/execution",
  systemDomain: "/new-project/system/:domain",
  system: "/new-project/system",
  summaryDomain: "/new-project/summary/:domain",
  summary: "/new-project/summary",
  output: "/new-project/summary",
  runDomain: "/new-project/run/:domain",
  run: "/new-project/run",
  future: "/new-project/future",

  // Project management
  projects: "/projects",
  projectsRunning: "/projects/running",
  projectsFinal: "/projects/final",
  projectsArchived: "/projects/archived",

  // Dashboard modules
  contact: "/contact",
  feedback: "/feedback",
  userFeedback: "/feedback",
  scenarios: "/scenarios",
  readyScenarios: "/scenarios",
  scenariosDomain: "/scenarios/:domain",
  scenariosDomainLevel: "/scenarios/:domain/:level",
  assistant: "/assistant",
  aiAssistant: "/assistant",
  education: "/education",

  // Fallback
  notFound: "*",
});

export const ROUTE_ALIASES = Object.freeze({
  auth: APP_ROUTES.login,
  output: APP_ROUTES.summary,
  userFeedback: APP_ROUTES.feedback,
  readyScenarios: APP_ROUTES.scenarios,
  aiAssistant: APP_ROUTES.assistant,
});

export const PROJECT_FLOW_ROUTES = Object.freeze([
  APP_ROUTES.newProject,
  APP_ROUTES.projectInfo,
  APP_ROUTES.environment,
  APP_ROUTES.projectPath,
  APP_ROUTES.solarSelect,
  APP_ROUTES.calculationMethod,
  APP_ROUTES.inputs,
  APP_ROUTES.execution,
  APP_ROUTES.system,
  APP_ROUTES.summary,
  APP_ROUTES.run,
  APP_ROUTES.future,
]);

export const PROJECT_MANAGEMENT_ROUTES = Object.freeze([
  APP_ROUTES.projects,
  APP_ROUTES.projectsRunning,
  APP_ROUTES.projectsFinal,
  APP_ROUTES.projectsArchived,
]);

export const DASHBOARD_MODULE_ROUTES = Object.freeze([
  APP_ROUTES.dashboard,
  APP_ROUTES.newProject,
  APP_ROUTES.projects,
  APP_ROUTES.scenarios,
  APP_ROUTES.assistant,
  APP_ROUTES.feedback,
  APP_ROUTES.education,
  APP_ROUTES.contact,
]);

export function routeWithParams(route, params = {}) {
  return Object.entries(params).reduce(
    (currentRoute, [key, value]) => currentRoute.replace(`:${key}`, encodeURIComponent(String(value))),
    route
  );
}
