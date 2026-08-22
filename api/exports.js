import { getSupabaseAdmin, jsonResponse, handleOptions, readJson, makeId } from './_lib/supabaseAdmin.js';

export default async function handler(req) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const db = getSupabaseAdmin();
  if (!db) return jsonResponse({ ok: false, error: 'Backend database is not configured.' }, 503);

  if (req.method === 'POST') {
    const body = await readJson(req);
    const row = {
      id: body.id || makeId('export'),
      project_id: body.project_id || body.projectId || null,
      type: body.type || 'json',
      title: body.title || 'خروجی پروژه SHIL',
      payload: body.payload || {},
      file_url: body.file_url || body.fileUrl || null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await db.from('shil_exports').insert(row).select('*').single();
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true, export: data });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`);
    const projectId = url.searchParams.get('project_id');
    let query = db.from('shil_exports').select('*').order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true, exports: data || [] });
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
