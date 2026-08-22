import { supabase } from "../backend/db/supabaseClient.js";

export const RUNTIME_APP_DATA_TABLE = "shil_app_data";
export const RUNTIME_KEYS = Object.freeze({
  consumerEquipment: "consumer_equipment",
  equipmentCatalog: "equipment_catalog",
  adminDefaults: "admin_defaults",
  projectPathCards: "project_path_cards",
  readyScenarios: "ready_scenarios",
});

const PREFIX = "shil:runtime:";
const EVENT = "shil:runtime-app-data";

function safeParse(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function getCachedRuntimeData(key, fallback = null) {
  if (typeof localStorage === "undefined") return fallback;
  const value = safeParse(localStorage.getItem(`${PREFIX}${key}`), null);
  return value == null ? fallback : value;
}

export function setCachedRuntimeData(key, value) {
  if (typeof localStorage === "undefined") return value;
  try { localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value)); } catch (error) { console.warn("SHIL runtime cache:", error?.message || error); }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value } }));
  return value;
}

export function subscribeRuntimeData(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = (event) => callback?.(event.detail || {});
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export async function loadRuntimeDataKey(key, fallback = null) {
  try {
    const { data, error } = await supabase.from(RUNTIME_APP_DATA_TABLE).select("key,value,updated_at").eq("key", key).maybeSingle();
    if (error) throw error;
    if (data?.value != null) return setCachedRuntimeData(key, data.value);
  } catch (error) {
    console.warn(`SHIL runtime load ${key}:`, error?.message || error);
  }
  return getCachedRuntimeData(key, fallback);
}

export async function bootstrapRuntimeAppData() {
  try {
    const keys = Object.values(RUNTIME_KEYS);
    const { data, error } = await supabase.from(RUNTIME_APP_DATA_TABLE).select("key,value,updated_at").in("key", keys);
    if (error) throw error;
    (data || []).forEach((row) => { if (row?.key && row.value != null) setCachedRuntimeData(row.key, row.value); });
    return data || [];
  } catch (error) {
    console.warn("SHIL runtime bootstrap:", error?.message || error);
    return [];
  }
}

export async function saveRuntimeAppData(key, value) {
  const { data, error } = await supabase
    .from(RUNTIME_APP_DATA_TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("key,value,updated_at")
    .single();
  if (error) throw error;
  setCachedRuntimeData(key, data?.value ?? value);
  return data;
}
