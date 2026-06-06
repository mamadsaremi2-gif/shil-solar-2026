export const enterpriseConfig = {
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  realtimeUrl: import.meta.env.VITE_REALTIME_URL || "",
  cloudStorageUrl: import.meta.env.VITE_CLOUD_STORAGE_URL || "",
  aiModel: import.meta.env.VITE_AI_MODEL || "gpt-4o-mini",
  production: import.meta.env.PROD,
};
