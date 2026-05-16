import React from "react";
import TextareaAutosize
from "react-textarea-autosize";

export default function SmartTextarea(
  props
) {

  return (

    <TextareaAutosize
      minRows={3}
      className="smart-textarea-v15"
      {...props}
    />

  );
}
