import React, { useState } from "react";

import QRCode from "react-qr-code";

export default function DeviceCommissioningPanel() {

  const [serial, setSerial] =
    useState("INV-2026-0001");

  return (

    <section className="fleet-panel-v15">

      <div className="widget-head-v15">

        <div>
          <span>DEVICE COMMISSIONING</span>
          <h3>راه‌اندازی تجهیزات</h3>
        </div>

      </div>

      <div className="commissioning-box-v15">

        <input
          value={serial}
          onChange={(e)=>
            setSerial(e.target.value)
          }
          placeholder="Serial Number"
        />

        <div className="commissioning-qr-v15">

          <QRCode
            value={serial}
            size={180}
          />

        </div>

      </div>

    </section>

  );
}
