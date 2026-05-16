import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const methodTitles = {
  equipment: "لیست تجهیزات",
  power: "توان کل",
  current: "جریان کل",
  profile: "پروفایل مصرف",
  energy: "انرژی مورد نیاز",
};

function EquipmentFields({ emergency }) {
  return (
    <>
      <div className="shil-form-grid">
        <label><span>نام تجهیز</span><input placeholder="مثلاً یخچال / روشنایی / پمپ" /></label>
        <label><span>تعداد</span><input placeholder="عدد" /></label>
        <label><span>توان</span><input placeholder="W" /></label>
        <label><span>ولتاژ</span><input placeholder="V" /></label>
        <label><span>{emergency ? "زمان برق اضطراری مورد نیاز" : "مدت مصرف روزانه"}</span><input placeholder={emergency ? "مدت مورد نیاز" : "مدت مصرف"} /></label>
        {emergency ? <label><span>اولویت بار</span><select><option>حیاتی</option><option>نیمه حیاتی</option><option>عادی</option></select></label> : <label><span>ضریب همزمانی</span><input placeholder="مثلاً 0.8" /></label>}
      </div>
      {emergency ? <div className="shil-reason-card">در برق اضطراری، اولویت بار برای تصمیم‌های هوشمند لازم است؛ اگر ظرفیت کافی نباشد، SHIL فقط با ذکر دلیل مهندسی بارهای غیرضروری را پیشنهاد به حذف می‌کند.</div> : null}
    </>
  );
}

export default function CalculationInputs() {
  const { domain = "solar", method = "equipment" } = useParams();
  const location = useLocation();
  const emergency = domain === "emergency";
  const subtype = location.state?.subtype || (emergency ? "emergency" : "solar");
  const title = `${methodTitles[method] || "ورودی محاسبات"} ${emergency ? "برق اضطراری" : "خورشیدی"}`;

  return (
    <EngineeringPageShell title={title}>
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>ورود دیتای مهندسی</h2><span>{emergency ? "Emergency Core" : subtype}</span></div>
          {method === "equipment" ? <EquipmentFields emergency={emergency} /> : null}
          {method === "power" ? <div className="shil-form-grid"><label><span>توان کل</span><input placeholder="W / kW" /></label><label><span>ولتاژ سیستم</span><input placeholder="V" /></label><label><span>ضریب رشد آینده</span><input placeholder="%" /></label>{emergency ? <label><span>زمان برق اضطراری مورد نیاز</span><input placeholder="مدت مورد نیاز" /></label> : null}</div> : null}
          {method === "current" ? <div className="shil-form-grid"><label><span>جریان کل</span><input placeholder="A" /></label><label><span>ولتاژ سیستم</span><input placeholder="V" /></label>{emergency ? <label><span>زمان برق اضطراری مورد نیاز</span><input placeholder="مدت مورد نیاز" /></label> : null}</div> : null}
          {method === "profile" ? <div className="shil-horizontal-block"><label className="shil-inline-field"><span>بازه ۱</span><input placeholder="مصرف" /></label><label className="shil-inline-field"><span>بازه ۲</span><input placeholder="مصرف" /></label><label className="shil-inline-field"><span>بازه ۳</span><input placeholder="مصرف" /></label><label className="shil-inline-field"><span>بازه ۴</span><input placeholder="مصرف" /></label></div> : null}
          {method === "energy" ? <div className="shil-form-grid"><label><span>انرژی مورد نیاز</span><input placeholder="Wh / kWh" /></label><label><span>ضریب اطمینان</span><input placeholder="%" /></label>{emergency ? <label><span>زمان برق اضطراری مورد نیاز</span><input placeholder="مدت مورد نیاز" /></label> : null}</div> : null}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>جمع لحظه‌ای</h2><span>Real-time</span></div>
          <div className="shil-summary-grid">
            <div><span>توان کل</span><strong>در انتظار دیتا</strong></div>
            <div><span>جریان کل</span><strong>در انتظار دیتا</strong></div>
            <div><span>انرژی مورد نیاز</span><strong>در انتظار دیتا</strong></div>
            <div><span>{emergency ? "پیک راه‌اندازی" : "پیک مصرف"}</span><strong>در انتظار دیتا</strong></div>
          </div>
        </div>

        <Link className="shil-primary-wide" to={`/new-project/system/${domain}`} state={{ method, subtype }}>تأیید و ادامه به تنظیمات سیستم</Link>
      </section>
    </EngineeringPageShell>
  );
}
