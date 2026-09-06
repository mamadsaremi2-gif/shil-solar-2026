import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import IosIconGrid from "../components/IosIconGrid.jsx";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { dashboardItems } from "../data/shilFlowConfig.jsx";
import { logoutCurrentSession } from "../auth/logout.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const items = useMemo(
    () => dashboardItems.map((item) => item.title === "خروج"
      ? {
          ...item,
          onClick: async () => {
            await logoutCurrentSession();
            navigate("/login", { replace: true });
          },
        }
      : item),
    [navigate]
  );

  return (
    <ShilPageShell hideHeader={true} hideFooter={true} title="داشبورد" className="shil-new-project-no-scroll shil-home-shell">
      <section className="shil-home-icons" dir="rtl">
        <IosIconGrid items={items} gridClass="new-project-grid-3x3" />
      </section>
    </ShilPageShell>
  );
}


