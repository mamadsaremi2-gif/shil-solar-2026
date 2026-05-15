import React from "react";
import { MapPinned, Ruler, Compass } from "lucide-react";
import { estimateTilt } from "../../industrial/gis/siteAnalysis.js";

export default function GISAnalysisPanel() {
  const latitude = 35.68;
  const tilt = estimateTilt(latitude);

  return (
    <section className="industrial-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>GIS / SITE ANALYSIS</span>
          <h3>تحلیل سایت و موقعیت</h3>
        </div>
      </div>

      <div className="industrial-grid-v15">
        <div>
          <MapPinned size={22} />
          <h4>Latitude</h4>
          <strong>{latitude}</strong>
        </div>

        <div>
          <Compass size={22} />
          <h4>Tilt</h4>
          <strong>{tilt}°</strong>
        </div>

        <div>
          <Ruler size={22} />
          <h4>Area</h4>
          <strong>Ready</strong>
        </div>
      </div>
    </section>
  );
}
