import React from "react";

import ReactJson
from "react-json-view";

export default function JsonViewer({
  data
}) {

  return (

    <div className="json-viewer-v15">

      <ReactJson
        src={data}
        theme="monokai"
        collapsed={1}
      />

    </div>

  );
}
