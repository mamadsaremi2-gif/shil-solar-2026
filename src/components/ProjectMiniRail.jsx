import React from "react";
import IosIconGrid from "./IosIconGrid.jsx";
import { projectSteps } from "../data/shilFlowConfig.jsx";

export default function ProjectMiniRail() {
  return (
    <div className="shil-project-mini-rail" aria-label="مراحل پروژه جدید">
      <IosIconGrid items={projectSteps} gridClass="project-mini-rail-grid" />
    </div>
  );
}
