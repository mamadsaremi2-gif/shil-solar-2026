import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import IosIconGrid from "../components/IosIconGrid.jsx";
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
    () => dashboardItems.map((item) => item.title === "Ø®Ø±ÙˆØ¬"
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
    <div className="shil-dashboard-home" dir="rtl">
      <div className="shil-master-bg shil-dashboard-bg" />
      <div className="shil-online-chip" data-online={online ? "true" : "false"}>
        <span />
        {online ? "Ú©Ø§Ø±Ø¨Ø± Ø¢Ù†Ù„Ø§ÛŒÙ† Ø§Ø³Øª" : "Ú©Ø§Ø±Ø¨Ø± Ø¢ÙÙ„Ø§ÛŒÙ† Ø§Ø³Øª"}
      </div>
      <IosIconGrid items={items} gridClass="dashboard-icons" />
    </div>
  );
}
