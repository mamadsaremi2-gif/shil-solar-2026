import { jsonResponse, handleOptions, getSupabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req) {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const db = getSupabaseAdmin();
  let database = 'not-configured';
  if (db) {
    const { error } = await db.from('shil_projects').select('id', { count: 'exact', head: true });
    database = error ? `error: ${error.message}` : 'connected';
  }
  return jsonResponse({
    ok: true,
    service: 'SHIL Backend/Infra',
    version: '1.0.0',
    database,
    ai: Boolean(process.env.OPENAI_API_KEY),
    storage: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString(),
  });
}
