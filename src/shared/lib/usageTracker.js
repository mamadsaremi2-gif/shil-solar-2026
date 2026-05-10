import { getSupabaseClient, isSupabaseConfigured } from './supabaseLazy.js';
import { flushQueuedUsageEvents, getVisitorId, isOnline, queueUsageEvent } from './offlineSync.js';
import { assertJsonSafe, sanitizeForJson } from './safeJson.js';

export const sanitizeUsagePayload = sanitizeForJson;

function buildUsageMetadata(payload = {}) {
  const safePayload = sanitizeUsagePayload(payload) ?? {};
  const metadata = {
    ...safePayload,
    online: isOnline(),
    appVersion: 'mobile-web-sizing-v2-usage-hardfix',
    visitorId: safePayload.visitorId ?? getVisitorId(),
  };
  return assertJsonSafe(metadata);
}

async function sendUsageEventNow(eventName, payload = {}) {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  const metadata = buildUsageMetadata(payload);
  const { error } = await supabase.from('usage_events').insert({
    event_name: String(eventName),
    metadata,
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
  const safePayload = sanitizeUsagePayload(payload) ?? {};

  if (!isSupabaseConfigured) {
    queueUsageEvent(eventName, { ...safePayload, reason: 'supabase_not_configured' });
    return;
  }

  if (!isOnline()) {
    queueUsageEvent(eventName, safePayload);
    return;
  }

  try {
    await flushQueuedUsageEvents(sendUsageEventNow);
    await sendUsageEventNow(eventName, safePayload);
  } catch (error) {
    queueUsageEvent(eventName, safePayload);
    console.warn('Usage tracking queued for later sync', error);
  }
}
