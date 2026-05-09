import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../../shared/lib/supabaseLazy";
import { buildSystemStatus, canUseLocalStorage } from "../model/systemStatus";

export function useSystemStatus(isOfflineMode) {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [localStorageReady, setLocalStorageReady] = useState(() => canUseLocalStorage());
  const [cloudState, setCloudState] = useState(() => (isSupabaseConfigured ? "checking" : "not-configured"));
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    function handleOnlineChange() {
      setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
      setLocalStorageReady(canUseLocalStorage());
    }

    window.addEventListener("online", handleOnlineChange);
    window.addEventListener("offline", handleOnlineChange);
    handleOnlineChange();

    return () => {
      window.removeEventListener("online", handleOnlineChange);
      window.removeEventListener("offline", handleOnlineChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkCloud() {
      if (!isSupabaseConfigured) {
        setCloudState("not-configured");
        setCheckedAt(new Date());
        return;
      }

      if (!isOnline || isOfflineMode) {
        setCloudState("offline");
        setCheckedAt(new Date());
        return;
      }

      setCloudState("checking");
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) throw new Error("Supabase client is not available");

        const { error } = await supabase.from("profiles").select("id").limit(1);
        if (cancelled) return;

        const isNetworkError = error && /fetch|network|failed|timeout/i.test(error.message || "");
        setCloudState(isNetworkError ? "disconnected" : "connected");
      } catch (error) {
        if (!cancelled) setCloudState("disconnected");
      } finally {
        if (!cancelled) setCheckedAt(new Date());
      }
    }

    checkCloud();
    const timer = window.setInterval(checkCloud, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOnline, isOfflineMode]);

  return useMemo(() => {
    const status = buildSystemStatus({
      isOnline,
      isConfigured: isSupabaseConfigured,
      isOfflineMode,
      localStorageReady,
      cloudState,
    });

    return {
      ...status,
      checkedAtLabel: checkedAt
        ? checkedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
        : "—",
    };
  }, [cloudState, checkedAt, isOfflineMode, isOnline, localStorageReady]);
}
