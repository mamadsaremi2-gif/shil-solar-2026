import React from "react";

import ReactFlow
from "reactflow";

import "reactflow/dist/style.css";

export default function WorkspaceFlow() {

  return (

    <div className="flow-v15">

      <ReactFlow
        nodes={[]}
        edges={[]}
        fitView
      />

    </div>

  );
}
