import { shilDataService } from "./shilDataService";

export function attachShilDataService() {
  window.SHIL = window.SHIL || {};
  window.SHIL.data = shilDataService;

  console.info("[SHIL] Data service attached.");
}
