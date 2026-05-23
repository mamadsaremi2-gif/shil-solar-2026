import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

export function initTelemetry() {
  const send = (metric) => {
    console.log("[SHIL Telemetry]", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  };

  onCLS(send);
  onINP(send);
  onLCP(send);
  onFCP(send);
  onTTFB(send);
}
