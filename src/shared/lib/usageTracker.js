import { getSupabaseClient, isSupabaseConfigured } from './supabaseLazy.js';
import { flushQueuedUsageEvents, isOnline, queueUsageEvent } from './offlineSync.js';

async function sendUsageEventNow(eventName, payload = {}) {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  const { error } = await supabase.from('usage_events').insert({
    event_name: eventName,
    metadata: {
      ...payload,
      online: isOnline(),
      appVersion: 'offline-ready',
      visitorId: payload.visitorId ?? (typeof window !== 'undefined' ? localStorage.getItem('shil-anonymous-visitor-id-v1') : null),
    },
    user_id: user?.id ?? null,
  });
  if (error) throw error;
}

let onlineListenerAttached = false;

function ensureOnlineFlushListener() {
  if (onlineListenerAttached || typeof window === 'undefined') return;
  onlineListenerAttached = true;
  window.addEventListener('online', () => {
    flushQueuedUsageEvents(sendUsageEventNow).catch((error) => {
      console.warn('Queued usage sync failed', error);
    });
  });
}

export async function syncQueuedUsageEvents() {
  ensureOnlineFlushListener();
  return flushQueuedUsageEvents(sendUsageEventNow);
}

export async function trackEvent(eventName, payload = {}) {
  ensureOnlineFlushListener();

  if (!isSupabaseConfigured) {
    queueUsageEvent(eventName, { ...payload, reason: 'supabase_not_configured' });
    return;
  }

  if (!isOnline()) {
    queueUsageEvent(eventName, payload);
    return;
  }

  try {
    await flushQueuedUsageEvents(sendUsageEventNow);
    await sendUsageEventNow(eventName, payload);
  } catch (error) {
    queueUsageEvent(eventName, payload);
    console.warn('Usage tracking queued for later sync', error);
  }
}
