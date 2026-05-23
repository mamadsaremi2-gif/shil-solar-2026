import React from "react";

export default function FormStatusCard({
  title,
  value,
  status,
}) {

  return (

    <div className={`
      form-status-card-v15
      ${status}
    `}>

      <h4>
        {title}
      </h4>

      <strong>
        {value}
      </strong>

    </div>

  );
}
