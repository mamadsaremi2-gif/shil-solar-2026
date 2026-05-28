import * as React from "react";
import { useNavigate } from "react-router-dom";
import IosIconGrid from "../components/IosIconGrid.jsx";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { dashboardItems } from "../data/shilFlowConfig.jsx";
import { clearSession } from "../auth/session.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [online, setOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const items = React.useMemo(
    () =>
      dashboardItems.map((item) =>
        item.title === "????"
          ? {
              ...item,
              onClick: () => {
                clearSession();
                navigate("/login", { replace: true });
              },
            }
          : item
      ),
    [navigate]
  );

  return (
    <ShilPageShell title="???????" className="shil-dashboard-shell shil-dashboard-mobile-final">
      <section className="shil-dashboard-home shil-dashboard-final-layout" dir="rtl">
        <div className="shil-dashboard-hero">
          <div className="shil-dashboard-eyebrow">SHIL ENGINEERING</div>
          <h1>??????? ?????? ???</h1>
          <p>?????? ???? ?? ????????? ???????? ???????? ? ???????? ??????</p>

          <div className="shil-dashboard-status-row">
            <div className="shil-online-chip shil-dashboard-online-chip" data-online={online ? "true" : "false"}>
              <span />
              {online ? "????? ?????? ???" : "????? ?????? ???"}
            </div>
          </div>
        </div>

        <IosIconGrid items={items} gridClass="dashboard-icons shil-dashboard-icons-final" />
      </section>
    </ShilPageShell>
  );
}
