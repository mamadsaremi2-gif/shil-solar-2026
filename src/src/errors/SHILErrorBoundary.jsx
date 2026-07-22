import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-box-v15 shil-safe-error-card" dir="rtl" role="alert">
      <h2>خطا در نمایش بخش</h2>
      <p>برنامه متوقف نشده است. برای ادامه دوباره تلاش کنید.</p>
      {error ? <code>{String(error?.message || error)}</code> : null}
      <button type="button" onClick={resetErrorBoundary}>تلاش دوباره</button>
    </div>
  );
}

export default function SHILErrorBoundary({ children }) {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
}
