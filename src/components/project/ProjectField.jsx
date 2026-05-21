import React from "react";

export default function ProjectField({
  label,
  placeholder,
  textarea = false,
  type = "text",
}) {
  return (
    <div className="project-field-v15">

      <label>{label}</label>

      {textarea ? (
        <textarea
          rows="5"
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
        />
      )}

    </div>
  );
}
