import OpenAI from 'openai';
import { jsonResponse, handleOptions, readJson } from './_lib/supabaseAdmin.js';

export default async function handler(req) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  if (!process.env.OPENAI_API_KEY) return jsonResponse({ ok: false, error: 'OPENAI_API_KEY تنظیم نشده است.' }, 503);

  const body = await readJson(req);
  const prompt = body.prompt || 'Realistic industrial engineering visualization of a solar installation site with photovoltaic panels and clean technical overlay.';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await openai.images.generate({
    model: process.env.SHIL_IMAGE_MODEL || 'gpt-image-1',
    prompt,
    size: body.size || '1024x1024',
  });
  const image = result.data?.[0];
  return jsonResponse({ ok: true, imageBase64: image?.b64_json || null, imageUrl: image?.url || null });
}
