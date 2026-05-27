import { createClient } from '@supabase/supabase-js';

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': process.env.SHIL_ALLOWED_ORIGIN || '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,x-admin-pin',
    },
  });
}

export function handleOptions(req) {
  if (req.method === 'OPTIONS') return jsonResponse({ ok: true });
  return null;
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function requireAdmin(req) {
  const expected = process.env.SHIL_ADMIN_PIN || '1366';
  const supplied = req.headers.get('x-admin-pin') || '';
  return supplied === expected;
}

export async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export function makeId(prefix = 'shil') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
