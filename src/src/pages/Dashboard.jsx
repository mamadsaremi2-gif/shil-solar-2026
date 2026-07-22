import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import IosIconGrid from "../components/IosIconGrid.jsx";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { dashboardItems } from "../data/shilFlowConfig.jsx";
import { clearSession } from "../auth/session.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const items = useMemo(
    () => dashboardItems.map((item) => item.title === "خروج"
      ? {
          ...item,
          onClick: () => {
            clearSession();
            navigate("/login", { replace: true });
          },
        }
      : item),
    [navigate]
  );

  return (
    <ShilPageShell hideHeader={true} hideFooter={true} title="داشبورد" className="shil-new-project-no-scroll shil-home-shell">
      <section className="shil-home-icons" dir="rtl">
        <div className="shil-online-chip" data-online={online ? "true" : "false"}>
          <span />
          {online ? "کاربر آنلاین است" : "کاربر آفلاین است"}
        </div>
        <IosIconGrid items={items} gridClass="new-project-grid-3x3" />
      </section>
    </ShilPageShell>
  );
}


