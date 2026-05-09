const EVENT_QUEUE_KEY = 'shil-offline-usage-event-queue-v1';
const VISITOR_ID_KEY = 'shil-anonymous-visitor-id-v1';
const MAX_QUEUE_SIZE = 500;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

export function getVisitorId() {
  if (!canUseStorage()) return 'server-render';
  let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function loadQueuedUsageEvents() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(EVENT_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueuedUsageEvents(events) {
  if (!canUseStorage()) return;
  const safeEvents = Array.isArray(events) ? events.slice(-MAX_QUEUE_SIZE) : [];
  window.localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(safeEvents));
}

export function queueUsageEvent(eventName, payload = {}) {
  if (!eventName) return;
  const events = loadQueuedUsageEvents();
  events.push({
    id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    eventName,
    payload,
    visitorId: getVisitorId(),
    queuedAt: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });
  saveQueuedUsageEvents(events);
}

export async function flushQueuedUsageEvents(sendEvent) {
  if (!isOnline() || typeof sendEvent !== 'function') return { ok: false, sent: 0, remaining: loadQueuedUsageEvents().length };
  const events = loadQueuedUsageEvents();
  if (!events.length) return { ok: true, sent: 0, remaining: 0 };

  const remaining = [];
  let sent = 0;

  for (const item of events) {
    try {
      await sendEvent(item.eventName, {
        ...(item.payload ?? {}),
        visitorId: item.visitorId ?? getVisitorId(),
        offlineQueued: true,
        queuedAt: item.queuedAt,
        sourceUrl: item.url,
      });
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }

  saveQueuedUsageEvents(remaining);
  return { ok: remaining.length === 0, sent, remaining: remaining.length };
}
