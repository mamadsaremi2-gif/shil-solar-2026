import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell";
import SmartCityInput, { findIranCityByName, getDefaultIranCity } from "../../components/SmartCityInput";
import { analyzeEnvironmentForEngineering } from "../../core/environment/environmentAssessment.js";

const installTypes = [
  { key: "urban", label: "شهری", humidityOffset: 0, soiling: 3, description: "محیط معمول شهری با ریسک متوسط گردوغبار" },
  { key: "industrial", label: "صنعتی", humidityOffset: 0, soiling: 7, description: "گردوغبار، دوده و آلودگی صنعتی بیشتر" },
  { key: "coastal", label: "ساحلی", humidityOffset: 18, soiling: 5, description: "رطوبت و خوردگی بالا؛ نیازمند IP و پوشش بهتر" },
  { key: "mountain", label: "کوهستانی", humidityOffset: -8, soiling: 2, description: "هوای خشک‌تر، دمای پایین‌تر و کنترل ولتاژ سرمایی" },
  { key: "desert", label: "کویری", humidityOffset: -14, soiling: 8, description: "تابش بالا، گردوغبار زیاد و نیاز به برنامه شست‌وشو" },
];

const isfahan = getDefaultIranCity();
const defaultClimate = {
  temperature: Number(isfahan?.averageTemperature ?? 23),
  temperatureMinC: Number(isfahan?.minTemperature ?? -4),
  temperatureMaxC: Number(isfahan?.maxTemperature ?? 41),
  altitude: Number(isfahan?.altitude ?? 1574),
  humidity: Number(isfahan?.humidity ?? 28),
  peakSunHours: Number(isfahan?.sunHours ?? 5.7),
  latitude: isfahan?.latitude ?? 32.6546,
  longitude: isfahan?.longitude ?? 51.668,
};

function clamp(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function getHumidityByInstallType(baseHumidity, installTypeKey) {
  const installType = installTypes.find((item) => item.key === installTypeKey);
  const next = Number(baseHumidity || defaultClimate.humidity) + Number(installType?.humidityOffset || 0);
  return Math.max(5, Math.min(95, Math.round(next)));
}

function cityToClimate(city, domain, installType) {
  const base = city ? {
    temperature: Number(city.averageTemperature ?? defaultClimate.temperature),
    temperatureMinC: Number(city.minTemperature ?? defaultClimate.temperatureMinC),
    temperatureMaxC: Number(city.maxTemperature ?? defaultClimate.temperatureMaxC),
    altitude: Number(city.altitude ?? defaultClimate.altitude),
    humidity: Number(city.humidity ?? defaultClimate.humidity),
    peakSunHours: domain === "solar" ? Number(city.sunHours ?? defaultClimate.peakSunHours) : 0,
    latitude: city.latitude ?? defaultClimate.latitude,
    longitude: city.longitude ?? defaultClimate.longitude,
  } : {
    ...defaultClimate,
    peakSunHours: domain === "solar" ? defaultClimate.peakSunHours : 0,
  };

  return {
    ...base,
    humidity: getHumidityByInstallType(base.humidity, installType),
  };
}

function fileToAttachment(file, type, latitude, longitude) {
  if (!file) return null;
  return {
    type,
    name: file.name,
    size: file.size,
    mime: file.type,
    capturedAt: new Date().toISOString(),
    capturedLocation: {
      latitude: latitude === "" ? null : Number(latitude),
      longitude: longitude === "" ? null : Number(longitude),
    },
    usage: type === "compass-screenshot" ? "orientation-reference" : "site-condition-reference",
  };
}

export default function Environment() {
  const navigate = useNavigate();
  const { domain = localStorage.getItem("shil:scenarioDomain") || "solar" } = useParams();

  const [city, setCity] = useState(isfahan?.name || "اصفهان");
  const [selectedCity, setSelectedCity] = useState(isfahan || null);
  const [manualOverride, setManualOverride] = useState(false);
  const [address, setAddress] = useState("");
  const [gpsMode, setGpsMode] = useState("auto");
  const [latitude, setLatitude] = useState(String(defaultClimate.latitude));
  const [longitude, setLongitude] = useState(String(defaultClimate.longitude));
  const [installType, setInstallType] = useState("urban");
  const [manualClimate, setManualClimate] = useState(() => cityToClimate(isfahan, domain, "urban"));
  const [compassAttachment, setCompassAttachment] = useState(null);
  const [siteAttachment, setSiteAttachment] = useState(null);
  const [compassPreview, setCompassPreview] = useState("");
  const [sitePreview, setSitePreview] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const activeInstallType = installTypes.find((item) => item.key === installType) || installTypes[0];

  useEffect(() => {
    const resolved = findIranCityByName(city) || selectedCity;
    if (!resolved || manualOverride) return;
    const nextClimate = cityToClimate(resolved, domain, installType);
    setManualClimate(nextClimate);
    if (gpsMode === "auto") {
      setLatitude(String(nextClimate.latitude ?? ""));
      setLongitude(String(nextClimate.longitude ?? ""));
    }
  }, [city, selectedCity, domain, installType, gpsMode, manualOverride]);

  const climate = useMemo(() => ({
    temperature: Number(manualClimate.temperature),
    temperatureMinC: Number(manualClimate.temperatureMinC),
    temperatureMaxC: Number(manualClimate.temperatureMaxC),
    altitude: Number(manualClimate.altitude),
    humidity: clamp(manualClimate.humidity, 5, 95),
    peakSunHours: domain === "solar" ? Number(manualClimate.peakSunHours) : 0,
    latitude,
    longitude,
  }), [manualClimate, domain, latitude, longitude]);

  const assessment = useMemo(() => analyzeEnvironmentForEngineering({
    domain,
    city,
    province: selectedCity?.province || "اصفهان",
    address,
    gpsMode,
    latitude: latitude === "" ? null : Number(latitude),
    longitude: longitude === "" ? null : Number(longitude),
    installType: activeInstallType.key,
    installTypeLabel: activeInstallType.label,
    temperatureAverageC: climate.temperature,
    temperatureMaxC: climate.temperatureMaxC,
    temperatureMinC: climate.temperatureMinC,
    altitude: climate.altitude,
    humidity: climate.humidity,
    peakSunHours: climate.peakSunHours,
    soilingLossPercent: activeInstallType.soiling,
    compassAttachment,
    siteAttachment,
  }), [domain, city, selectedCity, address, gpsMode, latitude, longitude, activeInstallType, climate, compassAttachment, siteAttachment]);

  const pickCity = (item) => {
    if (!item) return;
    setManualOverride(false);
    setSelectedCity(item);
    setCity(item.name || "");
    const nextClimate = cityToClimate(item, domain, installType);
    setManualClimate(nextClimate);
    setLatitude(item.latitude ? String(item.latitude) : "");
    setLongitude(item.longitude ? String(item.longitude) : "");
  };

  const updateClimate = (key, value) => {
    setManualOverride(true);
    setManualClimate((prev) => ({ ...prev, [key]: value }));
  };

  const restoreCityClimate = () => {
    const resolved = findIranCityByName(city) || selectedCity || isfahan;
    setManualOverride(false);
    setSelectedCity(resolved);
    setCity(resolved.name);
    const nextClimate = cityToClimate(resolved, domain, installType);
    setManualClimate(nextClimate);
    setLatitude(String(nextClimate.latitude ?? ""));
    setLongitude(String(nextClimate.longitude ?? ""));
  };

  const readPreview = (file, setter) => {
    if (!file) {
      setter("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleCompassUpload = (event) => {
    const file = event.target.files?.[0];
    setCompassAttachment(fileToAttachment(file, "compass-screenshot", latitude, longitude));
    readPreview(file, setCompassPreview);
  };

  const handleSiteUpload = (event) => {
    const file = event.target.files?.[0];
    setSiteAttachment(fileToAttachment(file, "site-photo", latitude, longitude));
    readPreview(file, setSitePreview);
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("مرورگر این دستگاه GPS را پشتیبانی نمی‌کند.");
      return;
    }

    setGpsStatus("در حال دریافت موقعیت دستگاه...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsMode("manual");
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setGpsStatus(`موقعیت دستگاه ثبت شد. دقت تقریبی: ${Math.round(position.coords.accuracy || 0)} متر`);
      },
      () => setGpsStatus("دسترسی به موقعیت داده نشد یا دریافت GPS ناموفق بود."),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  const confirmEnvironment = () => {
    const lat = latitude === "" ? null : Number(latitude);
    const lng = longitude === "" ? null : Number(longitude);

    if (!city.trim()) {
      setValidationMessage("نام شهر پروژه باید وارد یا از پیشنهادها انتخاب شود.");
      return;
    }
    if (lat !== null && (lat < 24 || lat > 40)) {
      setValidationMessage("عرض جغرافیایی واردشده خارج از بازه معمول ایران است.");
      return;
    }
    if (lng !== null && (lng < 43 || lng > 64)) {
      setValidationMessage("طول جغرافیایی واردشده خارج از بازه معمول ایران است.");
      return;
    }

    const environmentDraft = {
      domain,
      province: selectedCity?.province || "اصفهان",
      city,
      address,
      gpsMode,
      latitude: lat,
      longitude: lng,
      installType: activeInstallType.key,
      installTypeLabel: activeInstallType.label,
      temperatureAverageC: climate.temperature,
      temperatureMaxC: climate.temperatureMaxC,
      temperatureMinC: climate.temperatureMinC,
      altitude: climate.altitude,
      humidity: climate.humidity,
      peakSunHours: climate.peakSunHours,
      soilingLossPercent: activeInstallType.soiling,
      recommendedTiltDeg: assessment.recommendedTiltDeg,
      recommendedAzimuthDeg: assessment.recommendedAzimuthDeg,
      thermalDeratePercent: assessment.thermalDeratePercent,
      recommendedIngressProtection: assessment.recommendedIngressProtection,
      corrosionRisk: assessment.corrosionRisk,
      needsAntiCorrosion: assessment.needsAntiCorrosion,
      compassAttachment,
      siteAttachment,
      engineeringAssessment: assessment,
      manualOverride,
      source: selectedCity ? "iran-city-smart-catalog-with-manual-override" : "manual-entry",
    };

    localStorage.setItem("shil:environmentDraft", JSON.stringify(environmentDraft));
    localStorage.setItem("shil:environmentAssessment", JSON.stringify(assessment));
    navigate(`/new-project/method?domain=${domain}&from=environment`);
  };

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
              <label>شهر پروژه</label>
              <SmartCityInput
                value={city}
                onChange={(value) => { setCity(value); setManualOverride(false); }}
                onPick={pickCity}
                placeholder="اول اسم شهر را بزن؛ مثلاً اص، شی، ته، تب..."
              />
              <small className="shil-env-hint">
                استان جداگانه لازم نیست؛ انتخاب شهر، استان و داده‌های اقلیمی را خودکار وارد می‌کند. پیش‌فرض سیستم اصفهان است.
              </small>
            </div>

            <div className="shil-field">
              <label>آدرس پروژه</label>
              <input
                className="shil-input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="اختیاری؛ مثلاً شهرک صنعتی، پشت‌بام، مزرعه، ویلا..."
              />
            </div>

            <div className="shil-field">
              <label>مختصات GPS</label>
              <div className="shil-gps-toggle">
                <button type="button" className={gpsMode === "auto" ? "active" : ""} onClick={() => setGpsMode("auto")}>از شهر</button>
                <button type="button" className={gpsMode === "manual" ? "active" : ""} onClick={() => setGpsMode("manual")}>دستی</button>
                <button type="button" onClick={requestCurrentLocation}>GPS دستگاه</button>
              </div>
              <div className="shil-gps-manual-grid">
                <input className="shil-input" value={latitude} onChange={(event) => { setGpsMode("manual"); setLatitude(event.target.value); }} placeholder="Latitude" inputMode="decimal" />
                <input className="shil-input" value={longitude} onChange={(event) => { setGpsMode("manual"); setLongitude(event.target.value); }} placeholder="Longitude" inputMode="decimal" />
              </div>
              <small className="shil-env-hint">
                {gpsStatus || (selectedCity ? `موقعیت پیش‌فرض: ${selectedCity.name}، ${selectedCity.province}` : "شهر را از پیشنهادها انتخاب کن یا GPS دستگاه را بزن.")}
              </small>
            </div>
          </div>
        </section>

        <section className="shil-env-card">
          <div className="shil-section-row">
            <h3 className="shil-section-title">پارامترهای اقلیمی قابل ویرایش</h3>
            <button type="button" className="shil-mini-action" onClick={restoreCityClimate}>بازگشت به اقلیم شهر</button>
          </div>

          <div className="shil-manual-climate-grid">
            <div className="shil-field"><label>دمای میانگین °C</label><input className="shil-input" value={manualClimate.temperature} onChange={(event) => updateClimate("temperature", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>حداقل دما °C</label><input className="shil-input" value={manualClimate.temperatureMinC} onChange={(event) => updateClimate("temperatureMinC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>حداکثر دما °C</label><input className="shil-input" value={manualClimate.temperatureMaxC} onChange={(event) => updateClimate("temperatureMaxC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>ارتفاع از سطح دریا m</label><input className="shil-input" value={manualClimate.altitude} onChange={(event) => updateClimate("altitude", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>رطوبت %</label><input className="shil-input" value={manualClimate.humidity} onChange={(event) => updateClimate("humidity", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>ساعت آفتابی مؤثر</label><input className="shil-input" value={manualClimate.peakSunHours} onChange={(event) => updateClimate("peakSunHours", event.target.value)} inputMode="decimal" disabled={domain !== "solar"} /></div>
          </div>
          <small className="shil-env-hint">{manualOverride ? "داده‌ها در حالت ویرایش دستی هستند." : "داده‌ها از بانک هوشمند شهر انتخاب‌شده آمده‌اند."}</small>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">نوع محیط نصب</h3>
          <div className="shil-install-scroll">
            {installTypes.map((item) => (
              <button key={item.key} type="button" className={`shil-install-chip ${installType === item.key ? "active" : ""}`} onClick={() => setInstallType(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <small className="shil-env-hint">{activeInstallType.description}</small>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">آپلود مدارک محل نصب</h3>
          <div className="shil-upload-grid">
            <label className="shil-upload-box">
              <span>اسکرین‌شات قطب‌نما</span>
              <small>با موبایل در محل پروژه بگیر؛ مختصات فعلی کنار فایل ذخیره می‌شود و جنوب ۱۸۰ درجه مبنای اولیه قرار می‌گیرد.</small>
              <input type="file" accept="image/*" capture="environment" onChange={handleCompassUpload} />
              {compassPreview ? <img src={compassPreview} alt="Compass preview" /> : null}
            </label>
            <label className="shil-upload-box">
              <span>تصویر محل نصب سیستم خورشیدی</span>
              <small>برای بررسی سایه، فضای نصب، جهت پنل، موانع و محدودیت‌های اجرایی.</small>
              <input type="file" accept="image/*" capture="environment" onChange={handleSiteUpload} />
              {sitePreview ? <img src={sitePreview} alt="Site preview" /> : null}
            </label>
          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">تحلیل مهندسی خودکار</h3>
          <div className="shil-climate-grid">
            <div className="shil-climate-box"><span>زاویه پیشنهادی پنل</span><strong>{assessment.recommendedTiltDeg}°</strong></div>
            <div className="shil-climate-box"><span>جهت پیشنهادی</span><strong>{assessment.recommendedAzimuthDeg}° جنوب</strong></div>
            <div className="shil-climate-box"><span>افت حرارتی</span><strong>{assessment.thermalDeratePercent}%</strong></div>
            <div className="shil-climate-box"><span>ریسک خوردگی</span><strong>{assessment.corrosionRisk}</strong></div>
            <div className="shil-climate-box"><span>درجه حفاظت</span><strong>{assessment.recommendedIngressProtection}</strong></div>
            <div className="shil-climate-box"><span>وضعیت بررسی</span><strong>{assessment.status === "ready" ? "آماده" : "نیازمند بازبینی"}</strong></div>
          </div>
          {assessment.warnings.length ? (
            <div className="shil-warning-list">
              {assessment.warnings.map((item, index) => <p key={index}>{item}</p>)}
            </div>
          ) : <small className="shil-env-hint">هیچ هشدار محیطی جدی ثبت نشده است.</small>}
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">خلاصه داده‌های اعمال‌شده</h3>
          <div className="shil-climate-grid">
            <div className="shil-climate-box"><span>شهر</span><strong>{city || "اصفهان"}</strong></div>
            <div className="shil-climate-box"><span>استان</span><strong>{selectedCity?.province || "اصفهان"}</strong></div>
            <div className="shil-climate-box"><span>دمای میانگین</span><strong>{climate.temperature}°C</strong></div>
            <div className="shil-climate-box"><span>بازه دمایی</span><strong>{climate.temperatureMinC} تا {climate.temperatureMaxC}°C</strong></div>
            <div className="shil-climate-box"><span>ارتفاع</span><strong>{climate.altitude}m</strong></div>
            <div className="shil-climate-box"><span>رطوبت</span><strong>{climate.humidity}%</strong></div>
            <div className="shil-climate-box"><span>ساعت آفتابی</span><strong>{climate.peakSunHours}</strong></div>
            <div className="shil-climate-box"><span>ضریب آلودگی</span><strong>{activeInstallType.soiling}%</strong></div>
            <div className="shil-climate-box"><span>منبع داده</span><strong>{manualOverride ? "ویرایش دستی" : "بانک شهر"}</strong></div>
          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">نقشه گرمایشی ایران</h3>
          <div className="shil-map-container"><img src="/assets/shil/map/iran-heatmap.webp" alt="Iran Heatmap" /></div>
        </section>

        {validationMessage ? <div className="shil-env-error">{validationMessage}</div> : null}
        <button type="button" className="shil-primary-wide" onClick={confirmEnvironment}>تأیید شرایط محیطی و ادامه به روش محاسبات</button>
      </div>
    </ShilPageShell>
  );
}
