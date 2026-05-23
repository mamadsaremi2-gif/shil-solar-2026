import { registerSW } from "virtual:pwa-register";
import { initFullOfflineMode } from "./fullOfflineManager.js";

export function initShilPWA() {
  if (typeof window === "undefined") return;

  initFullOfflineMode();

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent("shil:pwa-update-ready", { detail: { updateSW } }));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent("shil:pwa-offline-ready"));
      document.documentElement.dataset.shilOfflineReady = "true";
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.warn("SHIL PWA registration failed:", error);
    },
  });
}
