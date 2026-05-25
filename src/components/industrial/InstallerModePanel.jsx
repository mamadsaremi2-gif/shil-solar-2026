import React from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { installerChecklist } from "../../industrial/installer/installerChecklist.js";

export default function InstallerModePanel() {
  return (
    <section className="industrial-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>INSTALLER MODE</span>
          <h3>??????? ??? ? ??????????</h3>
        </div>
      </div>

      <div className="installer-list-v15">
        {installerChecklist.map((item) => (
          <div key={item.id} className="installer-row-v15">
            <ClipboardCheck size={18} />
            <p>{item.title}</p>
            <CheckCircle2 size={18} />
          </div>
        ))}
      </div>
    </section>
  );
}
