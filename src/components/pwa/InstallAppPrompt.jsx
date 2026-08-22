import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../appearance/styles/shil-pwa-install-beta.css";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export default function InstallAppPrompt() {
  const location = useLocation();
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  const visible = useMemo(
    () => location.pathname === "/login" && !installed && Boolean(installEvent),
    [location.pathname, installed, installEvent]
  );

  useEffect(() => {
    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
    }

    function onInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } finally {
      setInstallEvent(null);
    }
  }

  if (!visible) return null;

  return (
    <button type="button" className="shil-beta-install-app" onClick={install}>
      نصب SHIL
    </button>
  );
}
