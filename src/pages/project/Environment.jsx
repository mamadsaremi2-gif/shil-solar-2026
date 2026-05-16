import React, { useState } from "react";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";
import SmartCityInput from "../../components/SmartCityInput.jsx";
import { SHIL_ASSETS } from "../../config/shilAssetPaths.js";

export default function Environment() {
  const [climate, setClimate] = useState(null);
  return (
    <EngineeringPageShell title="شرایط محیطی" className="shil-environment-page">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>موقعیت پروژه</h2><span>بانک هوشمند ایران</span></div>
          <div className="shil-form-grid">
            <SmartCityInput onPick={(item) => setClimate(item)} />
            <label><span>آدرس پروژه</span><input placeholder="اختیاری" /></label>
            <label><span>مختصات GPS</span><input placeholder={climate ? `${climate.latitude}, ${climate.longitude}` : "Auto / Manual"} /></label>
          </div>
          {climate ? <div className="shil-reason-card">اطلاعات اقلیمی شهر {climate.name} حتی در حالت آفلاین ثبت می‌شود: ارتفاع {climate.altitude} متر، میانگین دما {climate.averageTemperature}°C، ساعات تابش {climate.sunHours}.</div> : null}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>نقشه گرمایشی ایران</h2><span>Heatmap</span></div>
          <div className="shil-heatmap-frame">
            <img src={SHIL_ASSETS.maps.iranHeatmap} alt="نقشه گرمایشی ایران" />
            <div className="shil-heatmap-fallback">نقشه گرمایشی ایران در مسیر مشخص‌شده قرار می‌گیرد</div>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پارامترهای اقلیمی</h2><span>دیتای مهندسی</span></div>
          <div className="shil-horizontal-block shil-scrollbar-visible">
            {[
              ["دمای محیط", "°C"], ["ارتفاع از سطح دریا", "m"], ["رطوبت", "%"], ["سرعت باد", "km/h"], ["شدت تابش", "kWh/m²"], ["زاویه تابش", "deg"]
            ].map(([label, unit]) => <label key={label} className="shil-inline-field"><span>{label}</span><input placeholder={unit} /></label>)}
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>نوع محیط نصب</h2><span>اختیاری</span></div>
          <div className="shil-chip-row">
            {['شهری','صنعتی','ساحلی','کوهستانی','کویری','مرطوب'].map((item) => <button type="button" key={item}>{item}</button>)}
          </div>
        </div>
        <StepConfirmLink to="/new-project/path">تأیید مرحله و انتخاب مسیر پروژه</StepConfirmLink>
      </section>
    </EngineeringPageShell>
  );
}
