import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

export function reportWebVitals() {
  const sendMetric = (metric) => {
    console.log("[SHIL Vitals]", metric.name, metric.value);
  };

  onCLS(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
