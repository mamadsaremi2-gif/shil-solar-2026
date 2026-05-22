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

  const items = useMemo(() => {
    const baseItems = dashboardItems.map((item) =>
      item.title === "خروج"
        ? {
            ...item,
            onClick: () => {
              clearSession();
              navigate("/login", { replace: true });
            },
          }
        : item
    );

    const developmentItem = {
      id: "development",
      title: "توسعه",
      icon: "cube",
      path: "/development",
      disabled: true,
    };

    return [...baseItems.slice(0, 8), developmentItem];
  }, [navigate]);

  return (
    <ShilPageShell title="داشبورد" className="shil-dashboard-floating-shell">
      <section className="shil-dashboard-floating-page shil-dashboard-3x3-page" dir="rtl">
        <div className="shil-dashboard-mini-status" data-online={online ? "true" : "false"}>
          <span />
          {online ? "آنلاین" : "آفلاین"}
        </div>

        <IosIconGrid items={items} gridClass="dashboard-icons shil-dashboard-floating-icons shil-dashboard-icons-3x3" />
      </section>
    </ShilPageShell>
  );
}
