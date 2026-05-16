import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function SummaryPage() {
  const { domain = "solar" } = useParams();
  const location = useLocation();
  const emergency = domain === "emergency";
  const method = location.state?.method || "equipment";

  return (
    <EngineeringPageShell title="چکیده اطلاعات">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>خلاصه پروژه</h2><span>{emergency ? "برق اضطراری" : "خورشیدی"}</span></div>
          <div className="shil-summary-grid">
            <div><span>نام پروژه</span><strong>در انتظار ثبت</strong></div>
            <div><span>نوع کاربری</span><strong>در انتظار ثبت</strong></div>
            <div><span>موقعیت پروژه</span><strong>از شرایط محیطی</strong></div>
            <div><span>روش ورود دیتا</span><strong>{method}</strong></div>
          </div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>خلاصه مصرف و تجهیزات</h2><span>Validation</span></div>
          <div className="shil-summary-grid">
            <div><span>توان کل</span><strong>در انتظار محاسبه</strong></div>
            <div><span>جریان کل</span><strong>در انتظار محاسبه</strong></div>
            <div><span>انرژی مورد نیاز</span><strong>در انتظار محاسبه</strong></div>
            {emergency ? <div><span>زمان برق اضطراری مورد نیاز</span><strong>در انتظار ثبت</strong></div> : <div><span>ظرفیت پیشنهادی پنل</span><strong>در انتظار محاسبه</strong></div>}
          </div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پیشنهاد هوشمند SHIL</h2><span>با دلیل مهندسی</span></div>
          <div className="shil-reason-card">هر پیشنهاد یا حذف بار فقط همراه با دلیل نمایش داده می‌شود؛ مثال: افزایش ولتاژ سیستم به 48V باعث کاهش جریان و افت ولتاژ می‌شود.</div>
        </div>
        <Link className="shil-primary-wide" to={`/new-project/run/${domain}`} state={{ method }}>اجرای محاسبات نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
