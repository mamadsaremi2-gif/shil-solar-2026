import React from "react";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

export default function SplitWorkspace() {

  return (

    <PanelGroup direction="horizontal">

      <Panel defaultSize={50}>

        <div className="panel-v15">
          LEFT
        </div>

      </Panel>

      <PanelResizeHandle />

      <Panel defaultSize={50}>

        <div className="panel-v15">
          RIGHT
        </div>

      </Panel>

    </PanelGroup>

  );
}
