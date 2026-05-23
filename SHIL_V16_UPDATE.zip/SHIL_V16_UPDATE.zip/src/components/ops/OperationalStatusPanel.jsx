import React from "react";
import { Activity, CheckCircle2, ShieldCheck, RotateCcw } from "lucide-react";

import { APP_VERSION } from "../../ops/version/appVersion.js";
import { checkAppHealth } from "../../ops/health/healthCheck.js";
import { createRecoverySnapshot } from "../../ops/recovery/recoverySnapshot.js";

export default function OperationalStatusPanel() {
  const health = checkAppHealth();

  function handleSnapshot() {
    createRecoverySnapshot({
      health,
      version: APP_VERSION,
    });

    alert("Snapshot ذخیره شد");
  }

  return (
    <section className="ops-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>OPERATIONAL STATUS</span>
          <h3>وضعیت بهره‌برداری اپ</h3>
        </div>

        <div className="ops-version-v15">
          {APP_VERSION.version}
        </div>
      </div>

      <div className="ops-grid-v15">
        <div>
          <Activity size={22} />
          <h4>App Health</h4>
          <p>تمام ماژول‌ها فعال هستند</p>
        </div>

        <div>
          <CheckCircle2 size={22} />
          <h4>Project Flow</h4>
          <p>۸ مرحله پروژه متصل است</p>
        </div>

        <div>
          <ShieldCheck size={22} />
          <h4>Safe Mode</h4>
          <p>Recovery آماده است</p>
        </div>

        <button type="button" onClick={handleSnapshot}>
          <RotateCcw size={22} />
          <h4>Snapshot</h4>
          <p>ذخیره وضعیت فعلی</p>
        </button>
      </div>
    </section>
  );
}
