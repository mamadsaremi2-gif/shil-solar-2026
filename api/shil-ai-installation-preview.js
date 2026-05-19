function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 12 * 1024 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1] || 'image/png';
  const buffer = Buffer.from(match[2], 'base64');
  return { blob: new Blob([buffer], { type: mime }), mime };
}

async function requestOpenAIImageEdit({ prompt, imageDataUrl }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY_MISSING');
  const parsed = dataUrlToBlob(imageDataUrl);
  if (!parsed) throw new Error('SITE_IMAGE_DATA_URL_REQUIRED');

  const form = new FormData();
  form.append('model', process.env.SHIL_IMAGE_MODEL || 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', process.env.SHIL_IMAGE_SIZE || '1024x1024');
  form.append('image', parsed.blob, parsed.mime.includes('jpeg') ? 'site.jpg' : 'site.png');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OPENAI_IMAGE_EDIT_FAILED_${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function requestOpenAIImageGeneration({ prompt }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY_MISSING');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.SHIL_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: process.env.SHIL_IMAGE_SIZE || '1024x1024',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OPENAI_IMAGE_GENERATION_FAILED_${response.status}`;
    throw new Error(message);
  }
  return data;
}

function normalizeImageResponse(data) {
  const item = Array.isArray(data?.data) ? data.data[0] : null;
  const b64 = item?.b64_json || item?.b64 || null;
  const url = item?.url || null;
  return {
    provider: 'openai',
    model: process.env.SHIL_IMAGE_MODEL || 'gpt-image-1',
    createdAt: new Date().toISOString(),
    imageDataUrl: b64 ? `data:image/png;base64,${b64}` : null,
    imageUrl: url,
    rawStatus: data?.created ? 'generated' : 'generated',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

  try {
    const raw = await readBody(req);
    const payload = JSON.parse(raw || '{}');
    const prompt = String(payload?.prompt || '').trim();
    const imageDataUrl = payload?.imageDataUrl || payload?.image?.src || '';

    if (!prompt) return json(res, 400, { ok: false, error: 'PROMPT_REQUIRED' });

    let openAIData;
    let mode = 'edit-with-site-image';
    try {
      openAIData = await requestOpenAIImageEdit({ prompt, imageDataUrl });
    } catch (editError) {
      if (String(editError?.message || '').includes('SITE_IMAGE_DATA_URL_REQUIRED')) throw editError;
      mode = 'generation-fallback';
      openAIData = await requestOpenAIImageGeneration({ prompt });
    }

    return json(res, 200, { ok: true, mode, image: normalizeImageResponse(openAIData) });
  } catch (error) {
    return json(res, 500, { ok: false, error: error?.message || 'AI_IMAGE_SERVICE_FAILED' });
  }
}
