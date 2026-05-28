import * as React from "react";

import {
  Smartphone,
  Wifi,
} from "lucide-react";

import {
  getNativeDeviceInfo,
  getNetworkStatus,
} from "../../mobile/native/nativeBridge.js";

export default function NativeMobilePanel() {

  const [device, setDevice] =
    React.useState(null);

  const [network, setNetwork] =
    React.useState(null);

  React.useEffect(()=>{

    async function load() {

      try {

        const info =
          await getNativeDeviceInfo();

        const net =
          await getNetworkStatus();

        setDevice(info);
        setNetwork(net);

      } catch {}

    }

    load();

  },[]);

  return (

    <section className="fleet-panel-v15">

      <div className="widget-head-v15">

        <div>
          <span>NATIVE MOBILE</span>
          <h3>???? Native ??????</h3>
        </div>

      </div>

      <div className="fleet-grid-v15">

        <div className="fleet-card-v15">

          <Smartphone size={22} />

          <h4>
            {device?.model || "Device"}
          </h4>

          <p>
            {device?.platform || "web"}
          </p>

        </div>

        <div className="fleet-card-v15">

          <Wifi size={22} />

          <h4>
            {network?.connected
              ? "ONLINE"
              : "OFFLINE"}
          </h4>

          <p>
            {network?.connectionType || "unknown"}
          </p>

        </div>

      </div>

    </section>

  );
}
