import React from "react";
import SignatureCanvas
from "react-signature-canvas";

export default function SignaturePad() {

  return (

    <div className="signature-v15">

      <SignatureCanvas
        penColor="white"
        canvasProps={{
          width: 320,
          height: 180,
          className: "signature-canvas-v15",
        }}
      />

    </div>

  );
}
