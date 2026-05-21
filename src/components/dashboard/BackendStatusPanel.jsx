import React from "react";
import { Cloud, ShieldCheck, Database, UserCheck } from "lucide-react";
import { useAuthStore } from "../../backend/auth/authStore.js";

export default function BackendStatusPanel() {
  const authenticated = useAuthStore((state) => state.authenticated);

  return (
    <section className="backend-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>BACKEND CORE</span>
          <h3>وضعیت Backend / Auth / API</h3>
        </div>

        <div className={`backend-chip-v15 ${authenticated ? "online" : "offline"}`}>
          {authenticated ? "AUTH OK" : "GUEST"}
        </div>
      </div>

      <div className="backend-grid-v15">
        <div>
          <Cloud size={22} />
          <h4>Cloud API</h4>
          <p>Ready</p>
        </div>

        <div>
          <Database size={22} />
          <h4>Database</h4>
          <p>Supabase</p>
        </div>

        <div>
          <UserCheck size={22} />
          <h4>Auth</h4>
          <p>{authenticated ? "Signed In" : "Guest Mode"}</p>
        </div>

        <div>
          <ShieldCheck size={22} />
          <h4>Security</h4>
          <p>Token Guard</p>
        </div>
      </div>
    </section>
  );
}
