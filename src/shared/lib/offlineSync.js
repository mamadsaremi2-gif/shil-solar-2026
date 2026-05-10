import { safeJsonStringify, sanitizeForJson } from './safeJson.js';

const EVENT_QUEUE_KEY = 'shil-offline-usage-event-queue-v2';
const VISITOR_ID_KEY = 'shil-anonymous-visitor-id-v1';
const MAX_QUEUE_SIZE = 250;

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
    visitorId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
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
  const safeEvents = Array.isArray(events)
    ? events.slice(-MAX_QUEUE_SIZE).map((item) => sanitizeForJson(item)).filter(Boolean)
    : [];
  window.localStorage.setItem(EVENT_QUEUE_KEY, safeJsonStringify(safeEvents, '[]'));
}

export function queueUsageEvent(eventName, payload = {}) {
  if (!eventName) return;
  const safePayload = sanitizeForJson(payload) ?? {};
  const events = loadQueuedUsageEvents();
  events.push({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    eventName: String(eventName),
    payload: safePayload,
    visitorId: getVisitorId(),
    queuedAt: new Date().toISOString(),
    sourceUrl: typeof window !== 'undefined' ? String(window.location.href) : '',
    userAgent: typeof navigator !== 'undefined' ? String(navigator.userAgent) : '',
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
        ...(sanitizeForJson(item.payload) ?? {}),
        visitorId: item.visitorId ?? getVisitorId(),
        offlineQueued: true,
        queuedAt: item.queuedAt,
        sourceUrl: item.sourceUrl || item.url || '',
      });
      sent += 1;
    } catch {
      remaining.push(sanitizeForJson(item));
    }
  }

  saveQueuedUsageEvents(remaining);
  return { ok: remaining.length === 0, sent, remaining: remaining.length };
}
