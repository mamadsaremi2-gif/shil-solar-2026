export const aiConfig = {
  model: import.meta.env.VITE_AI_MODEL || "gpt-4o-mini",
  enabled: false,
  transport: "server-only",
};
