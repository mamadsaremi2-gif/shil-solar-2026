import React from "react";
import ShilPageShell from "./ShilPageShell.jsx";
import ProjectMiniRail from "./ProjectMiniRail.jsx";
import ProjectStepGuard from "./ProjectStepGuard.jsx";

export default function EngineeringPageShell({ title, children, className = "" }) {
  return (
    <ShilPageShell title={title} className={`shil-engineering-shell ${className}`}>
      <ProjectMiniRail />
      <div className="shil-engineering-content shil-ds-engineering-content">
        <ProjectStepGuard>{children}</ProjectStepGuard>
      </div>
    </ShilPageShell>
  );
}
