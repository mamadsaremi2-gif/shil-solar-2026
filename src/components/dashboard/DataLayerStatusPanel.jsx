import React from "react";
import { Database, Wifi, WifiOff, RefreshCcw, Download } from "lucide-react";

import { useDataLayerStore } from "../../data-layer/offline/dataLayerStore.js";
import { exportOfflineBackup } from "../../data-layer/backup/exportBackup.js";

export default function DataLayerStatusPanel() {
  const online = useDataLayerStore((state) => state.online);
  const syncStatus = useDataLayerStore((state) => state.syncStatus);
  const pendingJobs = useDataLayerStore((state) => state.pendingJobs);

  return (
    <section className="data-layer-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>OFFLINE DATA LAYER</span>
          <h3>????? ?????????? ? ??????????</h3>
        </div>

        <div className={`data-layer-chip-v15 ${online ? "online" : "offline"}`}>
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
          {online ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      <div className="data-layer-grid-v15">
        <div className="data-layer-card-v15">
          <Database size={22} />
          <h4>Local DB</h4>
          <p>Dexie / IndexedDB</p>
        </div>

        <div className="data-layer-card-v15">
          <RefreshCcw size={22} />
          <h4>Sync</h4>
          <p>{syncStatus} / {pendingJobs} jobs</p>
        </div>

        <button
          type="button"
          className="data-layer-card-v15 button"
          onClick={exportOfflineBackup}
        >
          <Download size={22} />
          <h4>Backup</h4>
          <p>Export ZIP</p>
        </button>
      </div>
    </section>
  );
}
