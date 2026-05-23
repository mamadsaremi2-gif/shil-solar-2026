import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import IosIconGrid from "../components/IosIconGrid.jsx";
import { projectSteps } from "../data/shilFlowConfig.jsx";

export default function NewProject() {
  return (
    <ShilPageShell title="پروژه جدید" className="shil-new-project-no-scroll">
      <IosIconGrid items={projectSteps} gridClass="new-project-grid-3x3" />
    </ShilPageShell>
  );
}
