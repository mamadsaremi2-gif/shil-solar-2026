import React from "react";
import { useLocation } from "react-router-dom";
import IosIconGrid from "./IosIconGrid.jsx";
import { projectSteps } from "../data/shilFlowConfig.jsx";

import {
  getFlowSteps,
  readProjectPath,
} from "../workflow/projectFlowRegistry.js";

function getActiveStepKey(pathname = "") {
  if (
    pathname === "/new-project" ||
    pathname === "/new-project/" ||
    pathname.startsWith("/new-project/path")
  ) {
    return "path";
  }

  if (pathname.startsWith("/new-project/info")) return "info";
  if (pathname.startsWith("/new-project/environment")) return "environment";
  if (pathname.startsWith("/new-project/method")) return "method";
  if (pathname.startsWith("/new-project/input")) return "inputs";
  if (pathname.startsWith("/new-project/system")) return "system";
  if (pathname.startsWith("/new-project/summary")) return "summary";
  if (pathname.startsWith("/new-project/run")) return "run";

  return "path";
}

export default function ProjectMiniRail() {
  const { pathname } = useLocation();

  const activeKey = getActiveStepKey(pathname);

  const domain =
    pathname.includes("/emergency")
      ? "emergency"
      : pathname.includes("/utility")
        ? "utility"
        : pathname.includes("/solar")
          ? "solar"
          : readProjectPath();

  const flowSteps = getFlowSteps(domain);

  const pathStep = projectSteps.find((step) => step.key === "path") || {
    key: "path",
    title: "انتخاب مسیر پروژه",
  };

  const items = [
    {
      ...pathStep,
      active: activeKey === "path",
    },
    ...flowSteps.map((step) => ({
      ...step,
      active: step.key === activeKey,
    })),
  ];

  return (
    <div
      className="shil-project-mini-rail"
      aria-label="مسیر مراحل پروژه"
    >
      <IosIconGrid
        items={items}
        gridClass="project-mini-rail-grid"
      />
    </div>
  );
}


