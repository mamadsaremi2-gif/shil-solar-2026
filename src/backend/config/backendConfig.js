export const backendConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SHIL_API_BASE || "",
  cloudSecurityMode: import.meta.env.VITE_SHIL_CLOUD_SECURITY_MODE || "production",
};
