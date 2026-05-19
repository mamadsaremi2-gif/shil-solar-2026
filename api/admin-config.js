import { getSupabaseAdmin, jsonResponse, handleOptions, readJson, requireAdmin } from './_lib/supabaseAdmin.js';

const table = 'shil_admin_config';

export default async function handler(req) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const db = getSupabaseAdmin();
  if (!db) return jsonResponse({ ok: false, error: 'Backend database is not configured.' }, 503);

  if (req.method === 'GET') {
    const { data, error } = await db.from(table).select('*').order('updated_at', { ascending: false });
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true, config: data || [] });
  }

  if (!requireAdmin(req)) return jsonResponse({ ok: false, error: 'دسترسی ادمین تایید نشد.' }, 401);

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJson(req);
    const row = {
      key: body.key,
      value: body.value || {},
      category: body.category || 'general',
      updated_at: new Date().toISOString(),
    };
    if (!row.key) return jsonResponse({ ok: false, error: 'key لازم است.' }, 400);
    const { data, error } = await db.from(table).upsert(row, { onConflict: 'key' }).select('*').single();
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    await db.from('shil_admin_audit_log').insert({ action: 'upsert_config', entity: row.key, payload: row });
    return jsonResponse({ ok: true, row: data });
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
