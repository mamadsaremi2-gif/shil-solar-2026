import React from "react";

import Webcam
from "react-webcam";

export default function SHILCamera() {

  return (

    <div className="camera-v15">

      <Webcam
        screenshotFormat="image/jpeg"
      />

    </div>

  );
}
