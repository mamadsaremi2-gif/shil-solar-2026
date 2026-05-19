import React from "react";

import {
  Tree,
  TreeNode,
} from "react-organizational-chart";

export default function SHILOrgChart() {

  return (

    <div className="orgchart-v15">

      <Tree
        label={<div>SHIL</div>}
      >

        <TreeNode
          label={<div>Solar</div>}
        >

          <TreeNode
            label={<div>Battery</div>}
          />

        </TreeNode>

      </Tree>

    </div>

  );
}
