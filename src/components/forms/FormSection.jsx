import React from "react";

export default function FormSection({
  title,
  subtitle,
  children,
}) {

  return (

    <section className="form-section-v15">

      <div className="form-section-head-v15">

        <div>

          <h3>{title}</h3>

          <span>{subtitle}</span>

        </div>

      </div>

      <div className="form-section-content-v15">

        {children}

      </div>

    </section>

  );
}
