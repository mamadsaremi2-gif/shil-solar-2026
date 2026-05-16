export const aiConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  model: import.meta.env.VITE_AI_MODEL || "gpt-4o-mini",
  enabled: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
};
