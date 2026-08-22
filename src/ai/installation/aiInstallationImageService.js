export const SHIL_AI_IMAGE_SERVICE_VERSION = "AI-IMAGE-SERVICE-v1.0";

function isDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

export async function generateAIInstallationImage(previewPayload, options = {}) {
  const endpoint = options.endpoint || "/api/shil-ai-installation-preview";
  const imageDataUrl = previewPayload?.image?.src || previewPayload?.image?.dataUrl || "";

  if (!previewPayload?.prompt) {
    return { ok: false, serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION, error: "پرامپت تولید تصویر آماده نیست." };
  }

  if (!isDataImage(imageDataUrl)) {
    return {
      ok: false,
      serviceVersion: SHIL_AI_IMAGE_SERVICE_VERSION,
      error: "برای تولید تصویر واقعی، عکس محل نصب باید به صورت فایل/تصویر داخل اپ ثبت شده باشد، نه فقط مسیر متنی.",
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
      error: error?.message || "ارتباط با سرویس تولید تصویر برقرار نشد.",
    };
  }
}
