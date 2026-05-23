import * as Sentry from "@sentry/react";
import { enterpriseConfig } from "../cloud/enterpriseConfig.js";

export function initSentry() {
  if (!enterpriseConfig.sentryDsn) return;

  Sentry.init({
    dsn: enterpriseConfig.sentryDsn,
    tracesSampleRate: 0.35,
    environment: enterpriseConfig.production ? "production" : "development",
  });
}
