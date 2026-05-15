import { useEffect } from "react";
import { useDataLayerStore } from "./dataLayerStore.js";

export function useOnlineStatus() {
  const setOnline = useDataLayerStore((state) => state.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);
}
