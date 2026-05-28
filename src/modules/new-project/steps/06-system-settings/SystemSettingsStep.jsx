import * as React from "react";
import { Link } from "react-router-dom";


export function SystemSettingsStep({ value = {} }) {
  const design = React.useMemo(() => ({
    valid: true,
    previewOnly: true,
    inverter: { title: "پیشنهاد روکشی اینورتر" },
    battery: { battery: { title: "پیشنهاد روکشی باتری" } },
    panel: { title: "پیشنهاد روکشی پنل" }
  }), [value]);

  return (
    <div className="shil-card-stack shil-system-settings-mini shil-system-settings-redirect">
      <div className="shil-section-card">
        <div className="shil-section-head">
          <h2>تنظیمات سیستم</h2>
          <span>مسیر جدید فعال</span>
        </div>
        <p className="shil-muted-text">
          بانک‌های پنل خورشیدی، اینورتر خورشیدی و باتری از این مرحله قدیمی حذف شدند و نسخه نهایی فقط در صفحه اصلی تنظیمات سیستم مدیریت می‌شود.
        </p>
        <div className="shil-result-grid">
          <div><span>اینورتر پیشنهادی</span><strong>{design.inverter?.title || "—"}</strong></div>
          <div><span>باتری پیشنهادی</span><strong>{design.battery?.battery?.title || "—"}</strong></div>
          <div><span>پنل پیشنهادی</span><strong>{design.panel?.title || "—"}</strong></div>
          <div><span>وضعیت</span><strong>{design.valid ? "آماده تایید" : "نیازمند تکمیل داده"}</strong></div>
        </div>
        <Link className="shil-primary-action" to="/new-project/system/solar">
          ورود به تنظیمات نهایی سیستم
        </Link>
      </div>
    </div>
  );
}
