import React from "react";

import QRCode
from "react-qr-code";

export default function SHILQRCode({
  value = "SHIL V15"
}) {

  return (

    <div className="qr-v15">

      <QRCode value={value} />

    </div>

  );
}
