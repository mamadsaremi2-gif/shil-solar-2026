import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div className="production-error-v15 shil-safe-error-card" dir="rtl" role="alert">
      <h2>خطا در اجرای برنامه</h2>
      <p>نمایش این بخش با خطا روبه‌رو شد.</p>
      {error ? <code>{String(error?.message || error)}</code> : null}
      <button type="button" onClick={resetErrorBoundary}>تلاش دوباره</button>
    </div>
  );
}

export default function ProductionErrorBoundary({ children }) {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
}
