import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function Fallback() {
  return (
    <div className="production-error-v15" dir="rtl">
      <h2>خطای موقت در ماژول</h2>
      <p>لطفاً صفحه را دوباره بارگذاری کنید.</p>
    </div>
  );
}

export default function ProductionErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ErrorBoundary>
  );
}
