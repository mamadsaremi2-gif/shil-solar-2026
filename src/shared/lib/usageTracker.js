import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export async function trackEvent(eventName, metadata = {}) {
  if (!isSupabaseConfigured) return;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || null;
    await supabase.from('usage_events').insert({
      user_id: userId,
      event_name: eventName,
      route: metadata.route || window.location.pathname || '/',
      metadata,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.warn('Usage tracking failed', error);
  }
}
