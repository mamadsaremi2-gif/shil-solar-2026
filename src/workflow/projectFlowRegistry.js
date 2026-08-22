import { projectSteps } from "../data/shilFlowConfig.jsx";

export const PROJECT_PATHS = {
  SOLAR: "solar",
  EMERGENCY: "emergency",
  UTILITY: "utility",
};

function step(key, routeOverride, titleOverride) {
  const base = projectSteps.find((item) => item.key === key) || {};
  return {
    ...base,
    key,
    title: titleOverride || base.title,
    route: routeOverride || base.to,
    to: routeOverride || base.to,
  };
}

export const PROJECT_FLOW_REGISTRY = {
  solar: {
    title: "اجرای پروژه با پنل خورشیدی",
    steps: [
      step("info"),
      step("environment"),
      step("method"),
      step("inputs"),
      step("system", "/new-project/system/solar"),
      step("summary", "/new-project/summary/solar"),
      step("run", "/new-project/run/solar"),
    ],
  },

  emergency: {
    title: "اجرای پروژه برق اضطراری",
    steps: [
      step("info"),
      step("method"),
      step("inputs"),
      step("system", "/new-project/system/emergency"),
      step("summary", "/new-project/summary/emergency"),
      step("run", "/new-project/run/emergency"),
    ],
  },

  utility: {
    title: "اجرای نیروگاه انرژی خورشیدی",
    steps: [
      step("info"),
      step("environment"),
      step("method", "/new-project/method", "روش طراحی نیروگاهی"),
      step("inputs", "/new-project/inputs", "ورودی نیروگاهی"),
      step("system", "/new-project/system/utility", "تنظیمات نیروگاهی"),
      step("summary", "/new-project/summary/utility"),
      step("run", "/new-project/run/utility"),
    ],
  },
};

export function readProjectPath() {
  try {
    const selected =
      JSON.parse(localStorage.getItem("shil:selectedProjectPath") || "null") ||
      JSON.parse(localStorage.getItem("shil:projectPath") || "null");

    if (typeof selected === "string") return selected;

    return (
      selected?.domain ||
      selected?.type ||
      selected?.key ||
      localStorage.getItem("shil:calculationDomain") ||
      PROJECT_PATHS.SOLAR
    );
  } catch {
    return localStorage.getItem("shil:calculationDomain") || PROJECT_PATHS.SOLAR;
  }
}

export function getCurrentFlow() {
  const path = readProjectPath();
  return PROJECT_FLOW_REGISTRY[path] || PROJECT_FLOW_REGISTRY.solar;
}

export function getNextRoute(currentKey) {
  const flow = getCurrentFlow();
  const index = flow.steps.findIndex((step) => step.key === currentKey);
  return flow.steps[index + 1]?.route || "/dashboard";
}

export function getFlowSteps() {
  return getCurrentFlow().steps;
}
