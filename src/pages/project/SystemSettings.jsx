import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function SystemSettings() {
  const { domain = "solar" } = useParams();
  const location = useLocation();
  const emergency = domain === "emergency";
  const method = location.state?.method || "equipment";

  return (
    <EngineeringPageShell title={emergency ? "تنظیمات برق اضطراری" : "تنظیمات سیستم خورشیدی"}>
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پارامترهای طراحی</h2><span>{emergency ? "Emergency Calculation Core" : "Solar Core"}</span></div>
          <div className="shil-form-grid">
            <label><span>ولتاژ سیستم</span><select><option>Auto</option><option>12V</option><option>24V</option><option>48V</option></select></label>
            <label><span>نوع باتری</span><select><option>لیتیوم</option><option>AGM</option><option>ژل</option><option>Tubular</option></select></label>
            <label><span>نوع اینورتر</span><select><option>سینوسی کامل</option><option>شبه سینوسی</option></select></label>
            {emergency ? <label><span>زمان برق اضطراری مورد نیاز</span><input placeholder="مدت مورد نیاز کاربر" /></label> : <label><span>درصد رزرو طراحی</span><input placeholder="%" /></label>}
            <label><span>اولویت طراحی</span><select><option>متعادل</option><option>اقتصادی</option><option>حرفه‌ای</option><option>صنعتی</option></select></label>
            <label><span>حالت طراحی</span><select><option>Auto Design</option><option>Manual Engineering</option></select></label>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>دیتاهای مهندسی تکمیلی</h2><span>مطابق نمونه، با UI جدید</span></div>
          <div className="shil-horizontal-block shil-engineering-data-row">
            {[
              "مشخصات پنل", "مشخصات اینورتر", "باتری", "MPPT / شارژکنترلر", "کابل‌ها", "حفاظت‌ها", "تابلو برق", "تجهیزات جانبی", "پارامترهای خروجی"
            ].map((item) => <div className="shil-data-tile" key={item}>{item}</div>)}
          </div>
        </div>

        {emergency ? <div className="shil-reason-card">عنوان محصول تخصصی فعلاً در رابط کاربری نمایش داده نمی‌شود؛ کاربر فقط مسیر برق اضطراری، اینورتر و باتری را می‌بیند، اما هسته محاسبات با منطق دقیق برق اضطراری اجرا می‌شود.</div> : null}

        <Link className="shil-primary-wide" to={`/new-project/summary/${domain}`} state={{ method }}>تأیید و مشاهده چکیده</Link>
      </section>
    </EngineeringPageShell>
  );
}
