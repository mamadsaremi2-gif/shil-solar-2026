import React from "react";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { SHIL_ASSETS } from "../../config/shilAssetPaths.js";

export default function Environment() {
  return (
    <EngineeringPageShell title="شرایط محیطی" className="shil-environment-page">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>موقعیت پروژه</h2><span>استان / شهر</span></div>
          <div className="shil-form-grid">
            <label><span>استان</span><input placeholder="مثلاً فارس" /></label>
            <label><span>شهر</span><input placeholder="مثلاً شیراز" /></label>
            <label><span>آدرس پروژه</span><input placeholder="اختیاری" /></label>
            <label><span>مختصات GPS</span><input placeholder="Auto / Manual" /></label>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>نقشه گرمایشی ایران</h2><span>Heatmap</span></div>
          <div className="shil-heatmap-frame">
            <img src={SHIL_ASSETS.maps.iranHeatmap} alt="نقشه گرمایشی ایران" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="shil-heatmap-fallback">نقشه گرمایشی ایران در مسیر مشخص‌شده قرار می‌گیرد</div>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پارامترهای اقلیمی</h2><span>دیتای مهندسی</span></div>
          <div className="shil-horizontal-block">
            {[
              ["دمای محیط", "°C"], ["ارتفاع از سطح دریا", "m"], ["رطوبت", "%"], ["سرعت باد", "km/h"], ["شدت تابش", "kWh/m²"], ["زاویه تابش", "deg"]
            ].map(([label, unit]) => <label key={label} className="shil-inline-field"><span>{label}</span><input placeholder={unit} /></label>)}
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>نوع محیط نصب</h2><span>اختیاری</span></div>
          <div className="shil-chip-row">
            {['شهری','صنعتی','ساحلی','کوهستانی','کویری','مرطوب'].map((item) => <button key={item}>{item}</button>)}
          </div>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
