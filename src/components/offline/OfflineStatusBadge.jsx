import React, { useEffect, useState } from "react";

export default function OfflineStatusBadge() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(
    typeof document !== "undefined" && document.documentElement.dataset.shilOfflineReady === "true"
  );

  useEffect(() => {
    const refresh = () => setOnline(navigator.onLine);
    const ready = () => setOfflineReady(true);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("shil:pwa-offline-ready", ready);
    refresh();
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("shil:pwa-offline-ready", ready);
    };
  }, []);

  return (
    <div className={`shil-offline-badge ${online ? "is-online" : "is-offline"}`} aria-live="polite">
      <span className="shil-offline-dot" />
      <span>{online ? (offlineReady ? "آنلاین / آماده آفلاین" : "آنلاین") : "حالت آفلاین فعال"}</span>
    </div>
  );
}
