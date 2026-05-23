import React from "react";

import "katex/dist/katex.min.css";

import {
  BlockMath
} from "react-katex";

export default function FormulaView({
  formula = "P = V \\times I"
}) {

  return (

    <div className="formula-v15">

      <BlockMath math={formula} />

    </div>

  );
}
