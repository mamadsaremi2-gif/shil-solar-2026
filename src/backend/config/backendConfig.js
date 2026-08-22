const viteEnv =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : {};

const nodeEnv =
  typeof process !== "undefined" && process.env
    ? process.env
    : {};

const env = {
  ...nodeEnv,
  ...viteEnv,
};

export const backendConfig = {
  supabaseUrl: env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || "",
  apiBaseUrl: env.VITE_API_BASE_URL || env.VITE_SHIL_API_BASE || "",
  cloudSecurityMode: env.VITE_SHIL_CLOUD_SECURITY_MODE || "production",
};
