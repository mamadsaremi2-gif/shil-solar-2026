import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../backend/db/supabaseClient.js";
import { backendConfig } from "../../backend/config/backendConfig.js";
import { isSupabaseReady } from "../../services/shilCloudSync.js";

const CHECK_INTERVAL_MS = 20000;
const CHECK_TIMEOUT_MS = 6000;

function initialState() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "disconnected";
  return "connecting";
}

export default function GlobalConnectionStatus() {
  const location = useLocation();
  const [status, setStatus] = useState(initialState);
  const requestIdRef = useRef(0);

  const checkConnection = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("disconnected");
      return;
    }

    if (!isSupabaseReady() || !backendConfig.supabaseUrl || !backendConfig.supabaseAnonKey) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(`${backendConfig.supabaseUrl}/auth/v1/health`, {
        method: "GET",
        headers: {
          apikey: backendConfig.supabaseAnonKey,
          Authorization: `Bearer ${backendConfig.supabaseAnonKey}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`health_${response.status}`);

      // Also touch the auth client. This verifies that the configured SHIL
      // client is usable, not merely that the browser has generic internet.
      const { error } = await supabase.auth.getSession();
      if (error) throw error;

      if (requestId === requestIdRef.current) setStatus("connected");
    } catch {
      if (requestId === requestIdRef.current) setStatus("disconnected");
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      ++requestIdRef.current;
      setStatus("disconnected");
    };
    const handleOnline = () => checkConnection();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkConnection();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkConnection();
    });

    checkConnection();
    const interval = window.setInterval(checkConnection, CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
      authListener?.subscription?.unsubscribe?.();
      ++requestIdRef.current;
    };
  }, [checkConnection]);

  // Keep authentication screens visually clean. From Dashboard onward the
  // same real connection indicator is used throughout the application.
  if (["/", "/login", "/register", "/welcome"].includes(location.pathname)) return null;

  const label = status === "connected"
    ? "اتصال برقرار است"
    : status === "connecting"
      ? "در حال اتصال..."
      : "اتصال قطع است";

  const routeClass = location.pathname === "/dashboard" ? "is-dashboard" : "is-inner-page";

  return (
    <div
      className={`shil-global-connection ${routeClass} is-${status}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
    >
      <span className="shil-global-connection-dot" aria-hidden="true" />
      <span className="shil-global-connection-label">{label}</span>
    </div>
  );
}
