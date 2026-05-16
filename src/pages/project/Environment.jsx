import { useMemo, useState } from "react";
import ShilPageShell from "../../components/ShilPageShell";
import SmartCityInput from "../../components/SmartCityInput";

const installTypes = [
  "شهری",
  "صنعتی",
  "ساحلی",
  "کوهستانی",
  "کویری"
];

export default function Environment() {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [gpsMode, setGpsMode] = useState("auto");

  const climate = useMemo(() => {
    return {
      temperature: 32,
      altitude: 1540,
      humidity: 38
    };
  }, [province, city]);

  return (
    <ShilPageShell
      title="شرایط محیطی"
      backLabel="بازگشت"
      nextLabel="تایید مرحله"
      prevLabel="مرحله قبل"
      draftLabel="ذخیره"
      scrollXVisible
    >
      <div className="shil-env-page">

        <section className="shil-env-card">
          <h3 className="shil-section-title">موقعیت پروژه</h3>

          <div className="shil-form-grid">

            <div className="shil-field">
              <label>استان</label>
              <SmartCityInput
                type="province"
                value={province}
                onChange={setProvince}
                placeholder="مثلاً فارس"
              />
            </div>

            <div className="shil-field">
              <label>شهر</label>
              <SmartCityInput
                type="city"
                province={province}
                value={city}
                onChange={setCity}
                placeholder="مثلاً شیراز"
              />
            </div>

            <div className="shil-field">
              <label>آدرس پروژه</label>
              <input
                className="shil-input"
                placeholder="اختیاری"
              />
            </div>

            <div className="shil-field">
              <label>مختصات GPS</label>

              <div className="shil-gps-toggle">
                <button
                  className={gpsMode === "auto" ? "active" : ""}
                  onClick={() => setGpsMode("auto")}
                >
                  Auto
                </button>

                <button
                  className={gpsMode === "manual" ? "active" : ""}
                  onClick={() => setGpsMode("manual")}
                >
                  Manual
                </button>
              </div>
            </div>

          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">
            نقشه گرمایشی ایران
          </h3>

          <div className="shil-map-container">
            <img
              src="/assets/shil/map/iran-heatmap.webp"
              alt="Iran Heatmap"
            />
          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">
            پارامترهای اقلیمی
          </h3>

          <div className="shil-climate-grid">

            <div className="shil-climate-box">
              <span>دمای محیط</span>
              <strong>{climate.temperature}°C</strong>
            </div>

            <div className="shil-climate-box">
              <span>ارتفاع از سطح دریا</span>
              <strong>{climate.altitude}m</strong>
            </div>

            <div className="shil-climate-box">
              <span>رطوبت</span>
              <strong>{climate.humidity}%</strong>
            </div>

          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">
            نوع محیط نصب
          </h3>

          <div className="shil-install-scroll">
            {installTypes.map((item) => (
              <button
                key={item}
                className="shil-install-chip"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

      </div>
    </ShilPageShell>
  );
}
