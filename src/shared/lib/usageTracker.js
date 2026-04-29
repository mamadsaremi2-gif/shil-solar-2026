import { getSupabaseClient, isSupabaseConfigured } from './supabaseLazy.js';

export async function trackEvent(eventName, payload = {}) {
  if (!isSupabaseConfigured) return;
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    await supabase.from('usage_events').insert({
      event_name: eventName,
      metadata: payload,
      user_id: user?.id ?? null,
    });
  } catch (error) {
    console.warn('Usage tracking failed', error);
  }
}
