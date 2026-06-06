import React from "react";
import JsonView from "@uiw/react-json-view";

export default function JsonViewer({
  data = {},
}) {
  return (
    <div className="json-viewer-v15">
      <JsonView
        value={data}
        collapsed={1}
        displayDataTypes={false}
        displayObjectSize={false}
      />
    </div>
  );
}
