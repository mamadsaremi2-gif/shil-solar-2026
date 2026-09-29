import { aiConfig } from "../aiConfig.js";
import { buildSizingPrompt } from "../prompts/sizingPrompt.js";
import { runLocalAIRecommendation } from "./localAIEngine.js";

export async function runAIEngineeringAssistant(project = {}) {
  // Cloud AI credentials must never be shipped in the browser bundle.
  // Until a dedicated server endpoint is wired for this assistant, use the
  // deterministic local recommendation engine.
  return runLocalAIRecommendation(project);
}
