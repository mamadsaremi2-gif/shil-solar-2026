import React from "react";

export default function SummaryBlock({
  title,
  children,
}) {

  return (
    <div className="summary-block-v15">

      <div className="summary-block-title-v15">
        {title}
      </div>

      <div className="summary-block-content-v15">
        {children}
      </div>

    </div>
  );
}
