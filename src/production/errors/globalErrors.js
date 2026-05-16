export function registerGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    console.error("[SHIL Global Error]", event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[SHIL Promise Error]", event.reason);
  });
}
