export function createTelemetryEvent(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    app: "SHIL_V15",
  };
}

export function trackEvent(type, payload = {}) {
  const event = createTelemetryEvent(type, payload);
  console.log("[SHIL Event]", event);
  return event;
}
