import React from "react";

import {
  RadioTower,
  TriangleAlert,
  Activity,
  Zap,
} from "lucide-react";

import {
  useFleetStore,
} from "../../fleet/sites/fleetStore.js";

export default function FleetMonitoringPanel() {

  const { sites } =
    useFleetStore();

  return (

    <section className="fleet-panel-v15">

      <div className="widget-head-v15">

        <div>
          <span>FLEET MONITORING</span>
          <h3>مانیتورینگ چند نیروگاه</h3>
        </div>

      </div>

      <div className="fleet-grid-v15">

        {sites.map((site)=>(

          <div
            key={site.id}
            className="fleet-card-v15"
          >

            <div className="fleet-top-v15">

              <div>
                <h4>{site.title}</h4>
                <p>{site.city}</p>
              </div>

              <div className={`
                fleet-status-v15
                ${site.status.toLowerCase()}
              `}>

                <RadioTower size={14} />

                {site.status}

              </div>

            </div>

            <div className="fleet-metrics-v15">

              <div>
                <Zap size={18} />
                <strong>{site.power}W</strong>
              </div>

              <div>
                <Activity size={18} />
                <strong>{site.energyToday}kWh</strong>
              </div>

              <div>
                <TriangleAlert size={18} />
                <strong>{site.alarms}</strong>
              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );
}
