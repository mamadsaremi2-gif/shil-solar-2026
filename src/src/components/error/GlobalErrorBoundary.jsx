import React from "react";

function getRuntimeErrorText(error) {
  if (!error) return "Unknown runtime error";
  const message = error?.message ? String(error.message) : String(error);
  const stack = error?.stack ? String(error.stack) : "";
  return stack || message;
}

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      const payload = {
        message: String(error?.message || error),
        stack: String(error?.stack || ""),
        componentStack: String(info?.componentStack || ""),
        at: new Date().toISOString(),
      };
      console.error("[SHIL ErrorBoundary]", error, info);
      localStorage.setItem("shil:lastRuntimeError", JSON.stringify(payload, null, 2));
    } catch {
      console.error("[SHIL ErrorBoundary]", error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="shil-safe-error-page" dir="rtl">
        <div className="shil-safe-error-card" role="alert">
          <div aria-hidden="true" style={{ fontSize: 34, lineHeight: 1 }}>⚠️</div>
          <h2>صفحه با خطای نمایشی روبه‌رو شد</h2>
          <p>
            داده‌های برنامه حذف نشده‌اند. خطای واقعی در کادر زیر نمایش داده شده تا بتوانیم دقیق برطرفش کنیم.
          </p>
          <code>{getRuntimeErrorText(this.state.error)}</code>
          <div>
            <button type="button" onClick={this.reset}>تلاش دوباره</button>
            <button type="button" onClick={() => { window.location.href = "/dashboard"; }}>
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      </div>
    );
  }
}
