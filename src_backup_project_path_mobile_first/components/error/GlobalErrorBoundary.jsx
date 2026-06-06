import React from "react";

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
      console.error("[SHIL ErrorBoundary]", error, info);
      localStorage.setItem("shil:lastRuntimeError", JSON.stringify({
        message: String(error?.message || error),
        stack: String(error?.stack || ""),
        at: new Date().toISOString(),
      }));
    } catch {}
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="shil-safe-error-page" dir="rtl">
        <div className="shil-safe-error-card">
          <h2>صفحه با خطای نمایشی روبه‌رو شد</h2>
          <p>موتور و داده‌ها حفظ شده‌اند. برای ادامه، صفحه را دوباره بارگذاری کنید یا به داشبورد برگردید.</p>
          <code>{String(this.state.error?.message || this.state.error)}</code>
          <div>
            <button type="button" onClick={this.reset}>تلاش دوباره</button>
            <button type="button" onClick={() => { window.location.href = "/dashboard"; }}>بازگشت به داشبورد</button>
          </div>
        </div>
      </div>
    );
  }
}
