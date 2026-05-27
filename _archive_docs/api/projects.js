import { getSupabaseAdmin, jsonResponse, handleOptions, readJson, makeId } from './_lib/supabaseAdmin.js';

const table = 'shil_projects';

function normalizeProject(input = {}) {
  const now = new Date().toISOString();
  return {
    id: input.id || makeId('project'),
    project_number: input.project_number || input.projectNumber || `SH-${Date.now().toString().slice(-6)}`,
    title: input.title || input.projectName || 'پروژه بدون عنوان',
    customer_name: input.customer_name || input.customerName || '',
    employer_name: input.employer_name || input.employerName || '',
    path: input.path || input.domain || input.projectPath || 'solar',
    status: input.status || 'draft',
    current_step: input.current_step || input.currentStep || 'project-info',
    payload: input.payload || input,
    updated_at: now,
    created_at: input.created_at || now,
  };
}

export default async function handler(req) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const db = getSupabaseAdmin();
  if (!db) return jsonResponse({ ok: false, error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY تنظیم نشده است.' }, 503);

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`);
    const status = url.searchParams.get('status');
    const id = url.searchParams.get('id');
    let query = db.from(table).select('*').order('updated_at', { ascending: false });
    if (id) query = query.eq('id', id).limit(1);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true, projects: data || [] });
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJson(req);
    const project = normalizeProject(body);
    const { data, error } = await db.from(table).upsert(project, { onConflict: 'id' }).select('*').single();
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true, project: data });
  }

  if (req.method === 'DELETE') {
    const body = await readJson(req);
    if (!body.id) return jsonResponse({ ok: false, error: 'id لازم است.' }, 400);
    const { error } = await db.from(table).delete().eq('id', body.id);
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
