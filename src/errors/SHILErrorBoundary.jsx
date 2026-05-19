import React from "react";

import {
  ErrorBoundary
} from "react-error-boundary";

function ErrorFallback() {

  return (

    <div className="error-box-v15">

      خطا در اجرای ماژول

    </div>

  );
}

export default function SHILErrorBoundary({
  children,
}) {

  return (

    <ErrorBoundary
      FallbackComponent={ErrorFallback}
    >

      {children}

    </ErrorBoundary>

  );
}
