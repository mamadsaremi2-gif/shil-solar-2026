import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useTelemetryStore } from "../../industrial/telemetry/telemetryStore.js";
import { evaluateAlarms } from "../../industrial/alarms/alarmEngine.js";

export default function AlarmCenterPanel() {
  const { inverter } = useTelemetryStore();
  const alarms = evaluateAlarms(inverter);

  return (
    <section className="industrial-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>ALARM CENTER</span>
          <h3>مرکز هشدار صنعتی</h3>
        </div>
      </div>

      <div className="alarm-list-v15">
        {alarms.length === 0 ? (
          <div className="alarm-row-v15 ok">
            <ShieldCheck size={20} />
            <div>
              <h4>بدون هشدار فعال</h4>
              <p>سیستم در وضعیت پایدار است.</p>
            </div>
          </div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.title} className={`alarm-row-v15 ${alarm.level}`}>
              <AlertTriangle size={20} />
              <div>
                <h4>{alarm.title}</h4>
                <p>{alarm.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
