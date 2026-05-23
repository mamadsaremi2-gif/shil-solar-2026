import React from "react";

export default function InputField({
  label,
  error,
  children,
}) {

  return (

    <div className="input-field-v15">

      <label>
        {label}
      </label>

      {children}

      {error && (

        <small>
          {error}
        </small>

      )}

    </div>

  );
}
