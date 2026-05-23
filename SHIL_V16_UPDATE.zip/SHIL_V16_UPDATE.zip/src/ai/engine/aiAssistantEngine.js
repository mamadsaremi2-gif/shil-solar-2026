import OpenAI from "openai";
import { aiConfig } from "../aiConfig.js";
import { buildSizingPrompt } from "../prompts/sizingPrompt.js";
import { runLocalAIRecommendation } from "./localAIEngine.js";

export async function runAIEngineeringAssistant(project = {}) {
  if (!aiConfig.enabled) {
    return runLocalAIRecommendation(project);
  }

  const client = new OpenAI({
    apiKey: aiConfig.apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.chat.completions.create({
    model: aiConfig.model,
    messages: [
      {
        role: "system",
        content:
          "You are SHIL V15, a professional solar engineering assistant.",
      },
      {
        role: "user",
        content: buildSizingPrompt(project),
      },
    ],
  });

  return {
    mode: "OPENAI",
    confidence: 0.92,
    recommendation:
      response.choices?.[0]?.message?.content || "",
  };
}
