import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../backend/db/supabaseClient.js";
import { createSession, getCurrentSession } from "./session.js";
import { logoutCurrentSession } from "./logout.js";
import { sessionCan } from "./access.js";
import { PERMISSIONS, normalizeAccessRole } from "./roles.js";

const VALIDATION_TTL_MS = 5 * 60 * 1000;

function validationKey(userId) {
  return `shil:auth:validated:${userId}`;
}

async function validateSupabaseSession(appSession) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user?.id || data.session.user.id !== appSession.userId) {
    throw new Error("AUTH_SESSION_INVALID");
  }

  if (typeof navigator !== "undefined" && navigator.onLine) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,role,status,full_name")
      .eq("id", appSession.userId)
      .single();

    let effectiveProfile = profile;
    if (profileError || !effectiveProfile) {
      try {
        const cached = JSON.parse(localStorage.getItem("shil_profile") || "null");
        if (cached?.id === appSession.userId && cached?.status === "approved") effectiveProfile = cached;
      } catch {}
    }
    if (!effectiveProfile || effectiveProfile.status !== "approved") {
      throw new Error("AUTH_PROFILE_NOT_APPROVED");
    }

    const accessRole = normalizeAccessRole(effectiveProfile.role || "viewer");
    const adminRole = ["admin", "super_admin"].includes(accessRole);
    const appRole = adminRole ? "admin" : "user";

    if (appSession.role !== appRole || appSession.accessRole !== accessRole) {
      createSession({
        role: appRole,
        accessRole,
        login: effectiveProfile.email || appSession.login,
        authType: "supabase",
        displayName: effectiveProfile.full_name || appSession.displayName || effectiveProfile.email,
        userId: appSession.userId,
      });
      localStorage.setItem("shil_profile", JSON.stringify(effectiveProfile));
    }
  }

  sessionStorage.setItem(validationKey(appSession.userId), String(Date.now()));
  return true;
}

function useValidatedSession() {
  const [state, setState] = useState(() => ({ loading: true, session: getCurrentSession(), valid: false }));
  const session = useMemo(() => getCurrentSession(), []);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!session?.userId || !["guest", "user", "admin"].includes(session.role)) {
        if (active) setState({ loading: false, session: null, valid: false });
        return;
      }

      if (session.authType !== "supabase") {
        if (active) setState({ loading: false, session, valid: true });
        return;
      }

      const last = Number(sessionStorage.getItem(validationKey(session.userId)) || 0);
      if (last && Date.now() - last < VALIDATION_TTL_MS) {
        if (active) setState({ loading: false, session, valid: true });
        return;
      }

      try {
        await validateSupabaseSession(session);
        if (active) setState({ loading: false, session: getCurrentSession(), valid: true });
      } catch {
        await logoutCurrentSession();
        if (active) setState({ loading: false, session: null, valid: false });
      }
    }
    run();
    return () => { active = false; };
  }, [session?.userId, session?.authType]);

  return state;
}

function GuardLoading() {
  return <div className="shil-route-fallback" aria-live="polite" aria-label="در حال اعتبارسنجی نشست" />;
}

export function RequireSession({ children }) {
  const location = useLocation();
  const { loading, valid } = useValidatedSession();
  if (loading) return <GuardLoading />;
  if (!valid) return <Navigate to="/login" replace state={{ from: location.pathname, reason: "auth" }} />;
  return children;
}

export function RequireAdmin({ children }) {
  const { loading, valid, session } = useValidatedSession();
  if (loading) return <GuardLoading />;
  if (!valid) return <Navigate to="/login" replace />;
  if (session?.role !== "admin" || !sessionCan(PERMISSIONS.ADMIN_ACCESS, session)) return <Navigate to="/dashboard" replace />;
  return children;
}

export function RequirePermission({ permission, children, fallback = "/dashboard" }) {
  const { loading, valid, session } = useValidatedSession();
  if (loading) return <GuardLoading />;
  if (!valid) return <Navigate to="/login" replace />;
  if (!sessionCan(permission, session)) return <Navigate to={fallback} replace />;
  return children;
}
