import { supabase } from "../backend/db/supabaseClient.js";

const API_BASE = import.meta.env.VITE_SHIL_API_BASE || "";

async function authHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const authenticatedHeaders = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...authenticatedHeaders,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `SHIL backend error: ${res.status}`);
  return data;
}

function localProjects() {
  try { return JSON.parse(localStorage.getItem("shil_projects_cache") || "[]"); } catch { return []; }
}

function writeLocalProject(project) {
  const items = localProjects().filter((p) => p.id !== project.id);
  const next = [{ ...project, updated_at: new Date().toISOString() }, ...items];
  localStorage.setItem("shil_projects_cache", JSON.stringify(next));
  return project;
}

export const shilBackendClient = {
  async health() {
    try { return await request("/api/health"); } catch (error) { return { ok: false, offline: true, error: error.message }; }
  },
  async saveProject(project) {
    try { return (await request("/api/projects", { method: "POST", body: JSON.stringify(project) })).project; }
    catch { return writeLocalProject(project); }
  },
  async listProjects(status) {
    try { return (await request(`/api/projects${status ? `?status=${encodeURIComponent(status)}` : ""}`)).projects || []; }
    catch { return status ? localProjects().filter((p) => p.status === status) : localProjects(); }
  },
  async saveExport(payload) {
    try { return (await request("/api/exports", { method: "POST", body: JSON.stringify(payload) })).export; }
    catch { return { ...payload, offline: true, created_at: new Date().toISOString() }; }
  },
  async generateInstallationImage(payload) {
    return request("/api/ai-installation-image", { method: "POST", body: JSON.stringify(payload) });
  },
  async adminConfig(key, value, pin) {
    if (!pin) throw new Error("PIN ادمین باید صریحاً برای عملیات حساس ارسال شود.");
    return request("/api/admin-config", { method: "POST", headers: { "x-admin-pin": String(pin) }, body: JSON.stringify({ key, value }) });
  },
};
