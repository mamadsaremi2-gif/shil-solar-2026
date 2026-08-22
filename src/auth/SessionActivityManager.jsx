import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentSession } from "./session.js";
import { logoutCurrentSession } from "./logout.js";
import { heartbeatCurrentSecuritySession } from "../services/securityCenterService.js";

const TIMEOUTS = {
  admin: 10 * 60 * 1000,
  user: 30 * 60 * 1000,
  guest: 60 * 60 * 1000,
};

export default function SessionActivityManager() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = getCurrentSession();
    if (!session?.role || location.pathname === "/login") return undefined;

    const timeoutMs = TIMEOUTS[session.role] || TIMEOUTS.user;
    let timer = null;
    let lastTouch = 0;

    const expire = async () => {
      await logoutCurrentSession("idle");
      navigate("/login", { replace: true, state: { reason: "idle" } });
    };

    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(expire, timeoutMs);
    };

    const activity = () => {
      const now = Date.now();
      if (now - lastTouch < 1000) return;
      lastTouch = now;
      arm();
    };

    let heartbeatTimer = null;
    if (session.authType === "supabase") {
      const heartbeat = async () => {
        try {
          const result = await heartbeatCurrentSecuritySession();
          if (result?.revoked) {
            await logoutCurrentSession("revoked");
            navigate("/login", { replace: true, state: { reason: "revoked" } });
          }
        } catch {}
      };
      heartbeat();
      heartbeatTimer = window.setInterval(heartbeat, 60 * 1000);
    }

    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, activity, { passive: true }));
    arm();

    return () => {
      window.clearTimeout(timer);
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      events.forEach((eventName) => window.removeEventListener(eventName, activity));
    };
  }, [location.pathname, navigate]);

  return null;
}
