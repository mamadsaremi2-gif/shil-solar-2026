import React from "react";
import ShilPageShell from "./ShilPageShell.jsx";
import ProjectMiniRail from "./ProjectMiniRail.jsx";

export default function EngineeringPageShell({ title, children, className = "" }) {
  return (
    <ShilPageShell title={title} className={`shil-engineering-shell ${className}`}>
      <ProjectMiniRail />
      <div className="shil-engineering-content">{children}</div>
    </ShilPageShell>
  );
}
