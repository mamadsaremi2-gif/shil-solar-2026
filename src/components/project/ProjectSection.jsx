import React from "react";

export default function ProjectSection({
  title,
  subtitle,
  children,
}) {
  return (
    <section className="project-section-v15">

      <div className="project-section-head-v15">

        <h3>{title}</h3>

        <span>{subtitle}</span>

      </div>

      {children}

    </section>
  );
}
