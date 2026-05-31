import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import SmartCityInput, { findIranCityByName, getDefaultIranCity } from "../../components/SmartCityInput";
import { analyzeEnvironmentForEngineering, estimateRecommendedTilt, normalizePersianNumber } from "../../core/environment/environmentAssessment.js";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { clearScenarioFlow, isScenarioFlowFor } from "../../workflow/flowIsolation.js";

const directionOptions = [
  { key: "north", label: "شمال", deg: 0 },
  { key: "east", label: "شرق", deg: 90 },
  { key: "south", label: "جنوب", deg: 180 },
  { key: "west", label: "غرب", deg: 270 },
];
const defaultDirectionSlots = { north: "north", east: "east", south: "south", west: "west" };
function toNumberInput(value, fallback = 0) { const n = Number(normalizePersianNumber(value)); return Number.isFinite(n) ? n : fallback; }
function normalizeDeg(value) { const n = toNumberInput(value, 180); return ((n % 360) + 360) % 360; }

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
  const [siteAttachments, setSiteAttachments] = useState([]);
  const [compassPreview, setCompassPreview] = useState("");
  const [sitePreviews, setSitePreviews] = useState([]);
  const [savedSiteImageCount, setSavedSiteImageCount] = useState(() => Number(localStorage.getItem("shil:environmentSiteImageCount") || 0));
  const [savedCompassImage, setSavedCompassImage] = useState(() => localStorage.getItem("shil:environmentCompassSaved") === "true");
  const [compassUploadChoice, setCompassUploadChoice] = useState("ask");
  const [gpsStatus, setGpsStatus] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [installTiltDeg, setInstallTiltDeg] = useState(String(estimateRecommendedTilt(defaultClimate.latitude)));
  const [installAzimuthDeg, setInstallAzimuthDeg] = useState("180");
  const [directionSlots, setDirectionSlots] = useState(defaultDirectionSlots);

  const activeInstallType = installTypes.find((item) => item.key === installType) || installTypes[0];

  useEffect(() => {
    const resolved = findIranCityByName(city) || selectedCity;
    if (!resolved || manualOverride) return;
    const nextClimate = cityToClimate(resolved, domain, installType);
    setManualClimate(nextClimate);
    if (gpsMode === "auto") {
      setLatitude(String(nextClimate.latitude ?? ""));
      setLongitude(String(nextClimate.longitude ?? ""));
      setInstallTiltDeg(String(estimateRecommendedTilt(nextClimate.latitude)));
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
    wiringLossPercent: 3,
    selectedTiltDeg: toNumberInput(installTiltDeg, estimateRecommendedTilt(latitude)),
    selectedAzimuthDeg: normalizeDeg(installAzimuthDeg),
    directionSlots,
    compassAttachment,
    siteAttachments,
    siteAttachment: siteAttachments[0] || null,
  }), [domain, city, selectedCity, address, gpsMode, latitude, longitude, activeInstallType, climate, installTiltDeg, installAzimuthDeg, directionSlots, compassAttachment, siteAttachments]);

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
    setInstallTiltDeg(String(estimateRecommendedTilt(nextClimate.latitude)));
    setInstallAzimuthDeg("180");
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
    const files = Array.from(event.target.files || []);
    setSiteAttachments(files.map((file) => fileToAttachment(file, "site-photo", latitude, longitude)).filter(Boolean));

    if (!files.length) {
      setSitePreviews([]);
      return;
    }

    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    }))).then(setSitePreviews);
  };

  const saveInstallationImages = () => {
    try {
      localStorage.setItem("shil:environmentSiteImages", JSON.stringify(sitePreviews));
      localStorage.setItem("shil:environmentSiteImageCount", String(sitePreviews.length));
      localStorage.setItem("shil:environmentCompassPreview", compassPreview || "");
      localStorage.setItem("shil:environmentCompassSaved", compassPreview ? "true" : "false");
      setSavedSiteImageCount(sitePreviews.length);
      setSavedCompassImage(Boolean(compassPreview));
    } catch {
      setValidationMessage("حجم تصاویر برای ذخیره محلی زیاد است؛ لطفاً تعداد یا حجم عکس‌ها را کمتر کن.");
    }
  };

  const routeStatusLabel = useMemo(() => {
    if (gpsMode === "manual") return gpsStatus ? "مسیر با لوکیشن دستگاه ثبت شده است" : "مسیر با مختصات دستی پیش رفته است";
    if (manualOverride) return "مسیر با داده‌های دستی اقلیمی پیش رفته است";
    if (selectedCity) return `مسیر با شهر ${selectedCity.name} پیش رفته است`;
    return "مسیر با ورود دستی شهر پیش رفته است";
  }, [gpsMode, gpsStatus, manualOverride, selectedCity]);

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
      selectedTiltDeg: assessment.selectedTiltDeg,
      selectedAzimuthDeg: assessment.selectedAzimuthDeg,
      directionSlots,
      orientationLossPercent: assessment.orientationLossPercent,
      tiltLossPercent: assessment.tiltLossPercent,
      totalOrientationLossPercent: assessment.totalOrientationLossPercent,
      orientationEfficiency: assessment.orientationEfficiency,
      totalLossPercent: assessment.totalLossPercent,
      effectiveEfficiency: assessment.effectiveEfficiency,
      thermalDeratePercent: assessment.thermalDeratePercent,
      recommendedIngressProtection: assessment.recommendedIngressProtection,
      corrosionRisk: assessment.corrosionRisk,
      needsAntiCorrosion: assessment.needsAntiCorrosion,
      compassAttachment,
      siteAttachments,
      siteAttachment: siteAttachments[0] || null,
      savedSiteImageCount,
      savedCompassImage,
      routeStatusLabel,
      engineeringAssessment: assessment,
      manualOverride,
      source: selectedCity ? "iran-city-smart-catalog-with-manual-override" : "manual-entry",
    };

    localStorage.setItem("shil:environmentDraft", JSON.stringify(environmentDraft));
    approveProjectStep("environment");
    localStorage.setItem("shil:environmentAssessment", JSON.stringify(assessment));

    const urlParams = new URLSearchParams(window.location.search || "");
    const scenarioFlowActive = urlParams.get("from") === "scenario" && isScenarioFlowFor(domain);
    const selectedScenario = (() => {
      try { return JSON.parse(localStorage.getItem("shil:selectedScenario") || "null"); }
      catch { return null; }
    })();

    if (scenarioFlowActive && ["solar", "emergency"].includes(domain) && selectedScenario?.id) {
      const scenarioDomain = selectedScenario.domain || domain;
      localStorage.setItem("shil:calculationMethod", "equipment");
      localStorage.setItem("shil:scenarioNextStep", `${scenarioDomain}-equipment-list`);
      localStorage.setItem("shil:scenarioEquipmentBranch", scenarioDomain);
      navigate("/new-project/method");
      return;
    }

    if (urlParams.get("from") !== "scenario") {
      clearScenarioFlow();
    }
    navigate("/new-project/method");
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
      <ProjectMiniRail />
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
                با انتخاب شهر مورد نظر دیتای اقلیمی پیش‌فرض در جدول وارد می‌شود.
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
          <div className="shil-map-container shil-env-location-map"><img src="/assets/shil/map/iran-heatmap.webp" alt="Iran heating system map" /></div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">شرایط نصب</h3>
          <div className="shil-install-scroll">
            {installTypes.map((item) => (
              <button key={item.key} type="button" className={`shil-install-chip ${installType === item.key ? "active" : ""}`} onClick={() => setInstallType(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <small className="shil-env-hint">{activeInstallType.description}</small>

          <div className="shil-manual-climate-grid shil-orientation-input-grid">
            <div className="shil-field"><label>جهت نصب پنل °</label><input className="shil-input" value={installAzimuthDeg} onChange={(event) => setInstallAzimuthDeg(event.target.value)} inputMode="decimal" placeholder="پیش‌فرض ۱۸۰ جنوب" /><small className="shil-env-hint">۰ شمال، ۹۰ شرق، ۱۸۰ جنوب، ۲۷۰ غرب؛ این عدد در راندمان و تلفات اعمال می‌شود.</small></div>
            <div className="shil-field"><label>زاویه نصب پنل °</label><input className="shil-input" value={installTiltDeg} onChange={(event) => setInstallTiltDeg(event.target.value)} inputMode="decimal" placeholder={`پیشنهادی ${assessment.recommendedTiltDeg}°`} /><small className="shil-env-hint">عدد دستی کاربر جایگزین زاویه پیشنهادی و وارد موتور محاسبات می‌شود.</small></div>
          </div>
          <div className="shil-climate-grid shil-orientation-factor-grid"><div className="shil-climate-box"><span>افت جهت</span><strong>{assessment.orientationLossPercent}%</strong></div><div className="shil-climate-box"><span>افت زاویه</span><strong>{assessment.tiltLossPercent}%</strong></div><div className="shil-climate-box"><span>ضریب جهت/زاویه</span><strong>{Math.round((assessment.orientationEfficiency || 1) * 100)}%</strong></div><div className="shil-climate-box"><span>راندمان نهایی محیطی</span><strong>{Math.round((assessment.effectiveEfficiency || 1) * 100)}%</strong></div></div>

          <div className="shil-upload-grid shil-install-upload-grid">
            <div className="shil-upload-box shil-smart-upload-box">
              <span>آپلود جهت‌نما</span>
              <div className="shil-upload-choice-row">
                <button type="button" className={compassUploadChoice === "gallery" ? "active" : ""} onClick={() => setCompassUploadChoice("gallery")}>انتخاب از گالری</button>
                <button type="button" className={compassUploadChoice === "later" ? "active" : ""} onClick={() => setCompassUploadChoice("later")}>بعداً</button>
              </div>
              {compassUploadChoice === "gallery" ? (
                <input type="file" accept="image/*" onChange={handleCompassUpload} />
              ) : null}
              {compassPreview ? (
                <div className="shil-orientation-frame" aria-label="پیش‌نمایش جهت‌نما با محورهای جغرافیایی">
                  {Object.entries({ north: "ورودی اصلی جهت", east: "لبه راست محل نصب", south: "جهت بهینه پنل", west: "لبه چپ محل نصب" }).map(([slot, hint]) => (
                    <label key={slot} className={`shil-orientation-label shil-orientation-${slot}`}>
                      <select className="shil-orientation-select" value={directionSlots[slot]} onChange={(event) => setDirectionSlots((prev) => ({ ...prev, [slot]: event.target.value }))}>
                        {directionOptions.map((item) => <option key={item.key} value={item.key}>{item.label} {item.deg}°</option>)}
                      </select>
                      <small>{hint}</small>
                    </label>
                  ))}
                  <div className="shil-orientation-image-shell">
                    <img src={compassPreview} alt="Compass preview" />
                  </div>
                </div>
              ) : null}
            </div>

            <label className="shil-upload-box shil-site-upload-box">
              <span>تصاویر محل نصب</span>
              <input type="file" accept="image/*" multiple onChange={handleSiteUpload} />
              {sitePreviews.length ? (
                <div className="shil-site-preview-grid shil-site-preview-contain-grid">
                  {sitePreviews.map((src, index) => (
                    <figure key={index} className="shil-site-preview-card">
                      <img src={src} alt={`Site preview ${index + 1}`} />
                      <figcaption>تصویر {index + 1}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : null}
            </label>
          </div>
          <button type="button" className="shil-mini-action shil-save-images-btn" onClick={saveInstallationImages}>ذخیره تصاویر نصب</button>
          <small className="shil-env-hint">{savedSiteImageCount || savedCompassImage ? `${savedSiteImageCount} تصویر محل نصب و ${savedCompassImage ? "جهت‌نما" : "بدون جهت‌نما"} ذخیره شده است.` : "تصاویر پس از انتخاب، در کادر کامل و بدون برش دیده می‌شوند."}</small>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">داده‌های اقلیمی</h3>

          <div className="shil-manual-climate-grid">
            <div className="shil-field"><label>دمای میانگین °C</label><input className="shil-input" value={manualClimate.temperature} onChange={(event) => updateClimate("temperature", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>حداقل دما °C</label><input className="shil-input" value={manualClimate.temperatureMinC} onChange={(event) => updateClimate("temperatureMinC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>حداکثر دما °C</label><input className="shil-input" value={manualClimate.temperatureMaxC} onChange={(event) => updateClimate("temperatureMaxC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>ارتفاع از سطح دریا m</label><input className="shil-input" value={manualClimate.altitude} onChange={(event) => updateClimate("altitude", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>رطوبت %</label><input className="shil-input" value={manualClimate.humidity} onChange={(event) => updateClimate("humidity", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>ساعت آفتابی مؤثر</label><input className="shil-input" value={manualClimate.peakSunHours} onChange={(event) => updateClimate("peakSunHours", event.target.value)} inputMode="decimal" disabled={domain !== "solar"} /></div>
          </div>
          <button type="button" className="shil-mini-action shil-climate-restore-bottom" onClick={restoreCityClimate}>بازگشت به اقلیم شهر</button>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">تحلیل مهندسی خودکار</h3>
          <div className="shil-climate-grid">
            <div className="shil-climate-box"><span>زاویه پیشنهادی پنل</span><strong>{assessment.recommendedTiltDeg}°</strong></div>
            <div className="shil-climate-box"><span>زاویه اعمال‌شده</span><strong>{assessment.selectedTiltDeg}°</strong></div>
            <div className="shil-climate-box"><span>جهت پیشنهادی</span><strong>{assessment.recommendedAzimuthDeg}° جنوب</strong></div>
            <div className="shil-climate-box"><span>جهت اعمال‌شده</span><strong>{assessment.selectedAzimuthDeg}°</strong></div>
            <div className="shil-climate-box"><span>افت حرارتی</span><strong>{assessment.thermalDeratePercent}%</strong></div>
            <div className="shil-climate-box"><span>افت جهت/زاویه</span><strong>{assessment.totalOrientationLossPercent}%</strong></div>
            <div className="shil-climate-box"><span>ریسک خوردگی</span><strong>{assessment.corrosionRisk}</strong></div>
            <div className="shil-climate-box"><span>درجه حفاظت</span><strong>{assessment.recommendedIngressProtection}</strong></div>
            <div className="shil-climate-box"><span>وضعیت مسیر</span><strong>{routeStatusLabel}</strong></div>
          </div>
          {assessment.warnings.length ? (
            <div className="shil-warning-list">
              {assessment.warnings.map((item, index) => <p key={index}>{item}</p>)}
            </div>
          ) : <small className="shil-env-hint">هیچ هشدار محیطی جدی ثبت نشده است.</small>}
        </section>

        {validationMessage ? <div className="shil-env-error">{validationMessage}</div> : null}
        <button type="button" className="shil-primary-wide" onClick={confirmEnvironment}>تأیید شرایط محیطی و ادامه</button>
      </div>
    </ShilPageShell>
  );
}
