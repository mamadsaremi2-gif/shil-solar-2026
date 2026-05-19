export const SHIL_AI_IMAGE_SERVICE_VERSION = "AI-IMAGE-SERVICE-v1.0";

function isDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

export async function generateAIInstallationImage(previewPayload, options = {}) {
  const endpoint = options.endpoint || "/api/shil-ai-installation-preview";
  const imageDataUrl = previewPayload?.image?.src || previewPayload?.image?.dataUrl || "";

  if (!previewPayload?.prompt) {
    return { ok: false, serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION, error: "Ù¾Ø±Ø§Ù…Ù¾Øª ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ± Ø¢Ù…Ø§Ø¯Ù‡ Ù†ÛŒØ³Øª." };
  }

  if (!isDataImage(imageDataUrl)) {
    return {
      ok: false,
      serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION,
      error: "Ø¨Ø±Ø§ÛŒ ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ± ÙˆØ§Ù‚Ø¹ÛŒØŒ Ø¹Ú©Ø³ Ù…Ø­Ù„ Ù†ØµØ¨ Ø¨Ø§ÛŒØ¯ Ø¨Ù‡ ØµÙˆØ±Øª ÙØ§ÛŒÙ„/ØªØµÙˆÛŒØ± Ø¯Ø§Ø®Ù„ Ø§Ù¾ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø¨Ø§Ø´Ø¯ØŒ Ù†Ù‡ ÙÙ‚Ø· Ù…Ø³ÛŒØ± Ù…ØªÙ†ÛŒ.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: previewPayload.prompt, imageDataUrl, previewPayload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || `AI_IMAGE_HTTP_${response.status}`);
    }
    return {
      ok: true,
      serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION,
      mode: data.mode,
      ...data.image,
    };
  } catch (error) {
    return {
      ok: false,
      serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION,
      error: error?.message || "Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ø³Ø±ÙˆÛŒØ³ ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ± Ø¨Ø±Ù‚Ø±Ø§Ø± Ù†Ø´Ø¯.",
    };
  }
}
