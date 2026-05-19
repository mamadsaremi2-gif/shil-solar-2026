import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import SmartCityInput, { findIranCityByName, getDefaultIranCity } from "../../components/SmartCityInput";
import { analyzeEnvironmentForEngineering } from "../../core/environment/environmentAssessment.js";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";

const installTypes = [
  { key: "urban", label: "Ø´Ù‡Ø±ÛŒ", humidityOffset: 0, soiling: 3, description: "Ù…Ø­ÛŒØ· Ù…Ø¹Ù…ÙˆÙ„ Ø´Ù‡Ø±ÛŒ Ø¨Ø§ Ø±ÛŒØ³Ú© Ù…ØªÙˆØ³Ø· Ú¯Ø±Ø¯ÙˆØºØ¨Ø§Ø±" },
  { key: "industrial", label: "ØµÙ†Ø¹ØªÛŒ", humidityOffset: 0, soiling: 7, description: "Ú¯Ø±Ø¯ÙˆØºØ¨Ø§Ø±ØŒ Ø¯ÙˆØ¯Ù‡ Ùˆ Ø¢Ù„ÙˆØ¯Ú¯ÛŒ ØµÙ†Ø¹ØªÛŒ Ø¨ÛŒØ´ØªØ±" },
  { key: "coastal", label: "Ø³Ø§Ø­Ù„ÛŒ", humidityOffset: 18, soiling: 5, description: "Ø±Ø·ÙˆØ¨Øª Ùˆ Ø®ÙˆØ±Ø¯Ú¯ÛŒ Ø¨Ø§Ù„Ø§Ø› Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ IP Ùˆ Ù¾ÙˆØ´Ø´ Ø¨Ù‡ØªØ±" },
  { key: "mountain", label: "Ú©ÙˆÙ‡Ø³ØªØ§Ù†ÛŒ", humidityOffset: -8, soiling: 2, description: "Ù‡ÙˆØ§ÛŒ Ø®Ø´Ú©â€ŒØªØ±ØŒ Ø¯Ù…Ø§ÛŒ Ù¾Ø§ÛŒÛŒÙ†â€ŒØªØ± Ùˆ Ú©Ù†ØªØ±Ù„ ÙˆÙ„ØªØ§Ú˜ Ø³Ø±Ù…Ø§ÛŒÛŒ" },
  { key: "desert", label: "Ú©ÙˆÛŒØ±ÛŒ", humidityOffset: -14, soiling: 8, description: "ØªØ§Ø¨Ø´ Ø¨Ø§Ù„Ø§ØŒ Ú¯Ø±Ø¯ÙˆØºØ¨Ø§Ø± Ø²ÛŒØ§Ø¯ Ùˆ Ù†ÛŒØ§Ø² Ø¨Ù‡ Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø´Ø³Øªâ€ŒÙˆØ´Ùˆ" },
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

  const [city, setCity] = useState(isfahan?.name || "Ø§ØµÙÙ‡Ø§Ù†");
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
  const [compassUploadChoice, setCompassUploadChoice] = useState("ask");
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
    province: selectedCity?.province || "Ø§ØµÙÙ‡Ø§Ù†",
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
    siteAttachments,
    siteAttachment: siteAttachments[0] || null,
  }), [domain, city, selectedCity, address, gpsMode, latitude, longitude, activeInstallType, climate, compassAttachment, siteAttachments]);

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

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Ù…Ø±ÙˆØ±Ú¯Ø± Ø§ÛŒÙ† Ø¯Ø³ØªÚ¯Ø§Ù‡ GPS Ø±Ø§ Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ Ù†Ù…ÛŒâ€ŒÚ©Ù†Ø¯.");
      return;
    }

    setGpsStatus("Ø¯Ø± Ø­Ø§Ù„ Ø¯Ø±ÛŒØ§ÙØª Ù…ÙˆÙ‚Ø¹ÛŒØª Ø¯Ø³ØªÚ¯Ø§Ù‡...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsMode("manual");
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setGpsStatus(`Ù…ÙˆÙ‚Ø¹ÛŒØª Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø«Ø¨Øª Ø´Ø¯. Ø¯Ù‚Øª ØªÙ‚Ø±ÛŒØ¨ÛŒ: ${Math.round(position.coords.accuracy || 0)} Ù…ØªØ±`);
      },
      () => setGpsStatus("Ø¯Ø³ØªØ±Ø³ÛŒ Ø¨Ù‡ Ù…ÙˆÙ‚Ø¹ÛŒØª Ø¯Ø§Ø¯Ù‡ Ù†Ø´Ø¯ ÛŒØ§ Ø¯Ø±ÛŒØ§ÙØª GPS Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯."),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  const confirmEnvironment = () => {
    const lat = latitude === "" ? null : Number(latitude);
    const lng = longitude === "" ? null : Number(longitude);

    if (!city.trim()) {
      setValidationMessage("Ù†Ø§Ù… Ø´Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ÛŒØ¯ ÙˆØ§Ø±Ø¯ ÛŒØ§ Ø§Ø² Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ù‡Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ø´ÙˆØ¯.");
      return;
    }
    if (lat !== null && (lat < 24 || lat > 40)) {
      setValidationMessage("Ø¹Ø±Ø¶ Ø¬ØºØ±Ø§ÙÛŒØ§ÛŒÛŒ ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ø®Ø§Ø±Ø¬ Ø§Ø² Ø¨Ø§Ø²Ù‡ Ù…Ø¹Ù…ÙˆÙ„ Ø§ÛŒØ±Ø§Ù† Ø§Ø³Øª.");
      return;
    }
    if (lng !== null && (lng < 43 || lng > 64)) {
      setValidationMessage("Ø·ÙˆÙ„ Ø¬ØºØ±Ø§ÙÛŒØ§ÛŒÛŒ ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ø®Ø§Ø±Ø¬ Ø§Ø² Ø¨Ø§Ø²Ù‡ Ù…Ø¹Ù…ÙˆÙ„ Ø§ÛŒØ±Ø§Ù† Ø§Ø³Øª.");
      return;
    }

    const environmentDraft = {
      domain,
      province: selectedCity?.province || "Ø§ØµÙÙ‡Ø§Ù†",
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
      siteAttachments,
      siteAttachment: siteAttachments[0] || null,
      engineeringAssessment: assessment,
      manualOverride,
      source: selectedCity ? "iran-city-smart-catalog-with-manual-override" : "manual-entry",
    };

    localStorage.setItem("shil:environmentDraft", JSON.stringify(environmentDraft));
    approveProjectStep("environment");
    localStorage.setItem("shil:environmentAssessment", JSON.stringify(assessment));
    navigate(`/new-project/path?domain=${domain}&from=environment`);
  };

  return (
    <ShilPageShell
      title="Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ"
      backLabel="Ø¨Ø§Ø²Ú¯Ø´Øª"
      nextLabel="ØªØ§ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡"
      prevLabel="Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„"
      draftLabel="Ø°Ø®ÛŒØ±Ù‡"
      scrollXVisible
    >
      <ProjectMiniRail />
      <div className="shil-env-page">
        <section className="shil-env-card shil-env-map-card">
          <h3 className="shil-section-title">Ù†Ù‚Ø´Ù‡ Ø³ÛŒØ³ØªÙ… Ú¯Ø±Ù…Ø§ÛŒØ´ÛŒ Ø§ÛŒØ±Ø§Ù†</h3>
          <div className="shil-map-container"><img src="/assets/shil/map/iran-heatmap.webp" alt="Iran heating system map" /></div>
          <small className="shil-env-hint">Ø§ÛŒÙ† Ù†Ù‚Ø´Ù‡ Ø¨Ù„Ø§ÙØ§ØµÙ„Ù‡ Ø¨Ø¹Ø¯ Ø§Ø² Ù…Ø³ÛŒØ± Ù…Ø±Ø§Ø­Ù„ Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯ ØªØ§ Ú©Ø§Ø±Ø¨Ø± Ù‚Ø¨Ù„ Ø§Ø² ÙˆØ±ÙˆØ¯ Ø§Ø·Ù„Ø§Ø¹Ø§ØªØŒ Ø¯ÛŒØ¯ Ø§Ù‚Ù„ÛŒÙ…ÛŒ Ø§ÙˆÙ„ÛŒÙ‡ Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´Ø¯.</small>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">Ù…ÙˆÙ‚Ø¹ÛŒØª Ù¾Ø±ÙˆÚ˜Ù‡</h3>

          <div className="shil-form-grid">
            <div className="shil-field">
              <label>Ø´Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡</label>
              <SmartCityInput
                value={city}
                onChange={(value) => { setCity(value); setManualOverride(false); }}
                onPick={pickCity}
                placeholder="Ø§ÙˆÙ„ Ø§Ø³Ù… Ø´Ù‡Ø± Ø±Ø§ Ø¨Ø²Ù†Ø› Ù…Ø«Ù„Ø§Ù‹ Ø§ØµØŒ Ø´ÛŒØŒ ØªÙ‡ØŒ ØªØ¨..."
              />
              <small className="shil-env-hint">
                Ø§Ø³ØªØ§Ù† Ø¬Ø¯Ø§Ú¯Ø§Ù†Ù‡ Ù„Ø§Ø²Ù… Ù†ÛŒØ³ØªØ› Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ù‡Ø±ØŒ Ø§Ø³ØªØ§Ù† Ùˆ Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ù‚Ù„ÛŒÙ…ÛŒ Ø±Ø§ Ø®ÙˆØ¯Ú©Ø§Ø± ÙˆØ§Ø±Ø¯ Ù…ÛŒâ€ŒÚ©Ù†Ø¯. Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø³ÛŒØ³ØªÙ… Ø§ØµÙÙ‡Ø§Ù† Ø§Ø³Øª.
              </small>
            </div>

            <div className="shil-field">
              <label>Ø¢Ø¯Ø±Ø³ Ù¾Ø±ÙˆÚ˜Ù‡</label>
              <input
                className="shil-input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Ø§Ø®ØªÛŒØ§Ø±ÛŒØ› Ù…Ø«Ù„Ø§Ù‹ Ø´Ù‡Ø±Ú© ØµÙ†Ø¹ØªÛŒØŒ Ù¾Ø´Øªâ€ŒØ¨Ø§Ù…ØŒ Ù…Ø²Ø±Ø¹Ù‡ØŒ ÙˆÛŒÙ„Ø§..."
              />
            </div>

            <div className="shil-field">
              <label>Ù…Ø®ØªØµØ§Øª GPS</label>
              <div className="shil-gps-toggle">
                <button type="button" className={gpsMode === "auto" ? "active" : ""} onClick={() => setGpsMode("auto")}>Ø§Ø² Ø´Ù‡Ø±</button>
                <button type="button" className={gpsMode === "manual" ? "active" : ""} onClick={() => setGpsMode("manual")}>Ø¯Ø³ØªÛŒ</button>
                <button type="button" onClick={requestCurrentLocation}>GPS Ø¯Ø³ØªÚ¯Ø§Ù‡</button>
              </div>
              <div className="shil-gps-manual-grid">
                <input className="shil-input" value={latitude} onChange={(event) => { setGpsMode("manual"); setLatitude(event.target.value); }} placeholder="Latitude" inputMode="decimal" />
                <input className="shil-input" value={longitude} onChange={(event) => { setGpsMode("manual"); setLongitude(event.target.value); }} placeholder="Longitude" inputMode="decimal" />
              </div>
              <small className="shil-env-hint">
                {gpsStatus || (selectedCity ? `Ù…ÙˆÙ‚Ø¹ÛŒØª Ù¾ÛŒØ´â€ŒÙØ±Ø¶: ${selectedCity.name}ØŒ ${selectedCity.province}` : "Ø´Ù‡Ø± Ø±Ø§ Ø§Ø² Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ù‡Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù† ÛŒØ§ GPS Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø±Ø§ Ø¨Ø²Ù†.")}
              </small>
            </div>
          </div>
        </section>

        <section className="shil-env-card">
          <div className="shil-section-row">
            <h3 className="shil-section-title">Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ù‚Ù„ÛŒÙ…ÛŒ</h3>
            <button type="button" className="shil-mini-action" onClick={restoreCityClimate}>Ø¨Ø§Ø²Ú¯Ø´Øª Ø¨Ù‡ Ø§Ù‚Ù„ÛŒÙ… Ø´Ù‡Ø±</button>
          </div>

          <div className="shil-manual-climate-grid">
            <div className="shil-field"><label>Ø¯Ù…Ø§ÛŒ Ù…ÛŒØ§Ù†Ú¯ÛŒÙ† Â°C</label><input className="shil-input" value={manualClimate.temperature} onChange={(event) => updateClimate("temperature", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>Ø­Ø¯Ø§Ù‚Ù„ Ø¯Ù…Ø§ Â°C</label><input className="shil-input" value={manualClimate.temperatureMinC} onChange={(event) => updateClimate("temperatureMinC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>Ø­Ø¯Ø§Ú©Ø«Ø± Ø¯Ù…Ø§ Â°C</label><input className="shil-input" value={manualClimate.temperatureMaxC} onChange={(event) => updateClimate("temperatureMaxC", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>Ø§Ø±ØªÙØ§Ø¹ Ø§Ø² Ø³Ø·Ø­ Ø¯Ø±ÛŒØ§ m</label><input className="shil-input" value={manualClimate.altitude} onChange={(event) => updateClimate("altitude", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>Ø±Ø·ÙˆØ¨Øª %</label><input className="shil-input" value={manualClimate.humidity} onChange={(event) => updateClimate("humidity", event.target.value)} inputMode="decimal" /></div>
            <div className="shil-field"><label>Ø³Ø§Ø¹Øª Ø¢ÙØªØ§Ø¨ÛŒ Ù…Ø¤Ø«Ø±</label><input className="shil-input" value={manualClimate.peakSunHours} onChange={(event) => updateClimate("peakSunHours", event.target.value)} inputMode="decimal" disabled={domain !== "solar"} /></div>
          </div>
          <small className="shil-env-hint">{manualOverride ? "Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ Ø¯Ø± Ø­Ø§Ù„Øª ÙˆÛŒØ±Ø§ÛŒØ´ Ø¯Ø³ØªÛŒ Ù‡Ø³ØªÙ†Ø¯." : "Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ Ø§Ø² Ø¨Ø§Ù†Ú© Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø´Ù‡Ø± Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ø¢Ù…Ø¯Ù‡â€ŒØ§Ù†Ø¯."}</small>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">Ø´Ø±Ø§ÛŒØ· Ù†ØµØ¨</h3>
          <div className="shil-install-scroll">
            {installTypes.map((item) => (
              <button key={item.key} type="button" className={`shil-install-chip ${installType === item.key ? "active" : ""}`} onClick={() => setInstallType(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <small className="shil-env-hint">{activeInstallType.description}</small>

          <div className="shil-upload-grid shil-install-upload-grid">
            <div className="shil-upload-box shil-smart-upload-box">
              <span>Ø¢Ù¾Ù„ÙˆØ¯ Ø¬Ù‡Øªâ€ŒÙ†Ù…Ø§</span>
              <small>Ø§Ù¾ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ù‡ÙˆØ´Ù…Ù†Ø¯ Ù…ÛŒâ€ŒÙ¾Ø±Ø³Ø¯ Ø¢ÛŒØ§ Ù…ÛŒâ€ŒØ®ÙˆØ§Ù‡ÛŒ Ø§Ø³Ú©Ø±ÛŒÙ† Ø¬Ù‡Øªâ€ŒÙ†Ù…Ø§ Ø±Ø§ Ø§Ø² Ú¯Ø§Ù„Ø±ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒ ÛŒØ§ ÙØ¹Ù„Ø§Ù‹ Ø¨Ø¹Ø¯Ø§Ù‹ Ø§Ø¶Ø§ÙÙ‡ Ø´ÙˆØ¯.</small>
              <div className="shil-upload-choice-row">
                <button type="button" className={compassUploadChoice === "gallery" ? "active" : ""} onClick={() => setCompassUploadChoice("gallery")}>Ø§Ù†ØªØ®Ø§Ø¨ Ø§Ø² Ú¯Ø§Ù„Ø±ÛŒ</button>
                <button type="button" className={compassUploadChoice === "later" ? "active" : ""} onClick={() => setCompassUploadChoice("later")}>Ø¨Ø¹Ø¯Ø§Ù‹</button>
              </div>
              {compassUploadChoice === "gallery" ? (
                <input type="file" accept="image/*" onChange={handleCompassUpload} />
              ) : null}
              {compassPreview ? <img src={compassPreview} alt="Compass preview" /> : null}
            </div>

            <label className="shil-upload-box">
              <span>ØªØµØ§ÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨</span>
              <small>Ø¨Ø§ ØªÙˆØ¬Ù‡ Ø¨Ù‡ ÙˆØ³Ø¹Øª Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ØŒ Ú†Ù†Ø¯ Ø¹Ú©Ø³ Ø§Ø² Ø¨Ø§Ù…ØŒ Ù…Ø­ÙˆØ·Ù‡ØŒ Ø³Ø§ÛŒÙ‡â€ŒØ§Ù†Ø¯Ø§Ø²Ù‡Ø§ØŒ Ù…Ø³ÛŒØ± Ú©Ø§Ø¨Ù„ Ùˆ Ù…ÙˆØ§Ù†Ø¹ Ø¢Ù¾Ù„ÙˆØ¯ Ú©Ù†.</small>
              <input type="file" accept="image/*" multiple onChange={handleSiteUpload} />
              {sitePreviews.length ? (
                <div className="shil-site-preview-grid">
                  {sitePreviews.map((src, index) => <img key={index} src={src} alt={`Site preview ${index + 1}`} />)}
                </div>
              ) : null}
            </label>
          </div>
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">ØªØ­Ù„ÛŒÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±</h3>
          <div className="shil-climate-grid">
            <div className="shil-climate-box"><span>Ø²Ø§ÙˆÛŒÙ‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ Ù¾Ù†Ù„</span><strong>{assessment.recommendedTiltDeg}Â°</strong></div>
            <div className="shil-climate-box"><span>Ø¬Ù‡Øª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ</span><strong>{assessment.recommendedAzimuthDeg}Â° Ø¬Ù†ÙˆØ¨</strong></div>
            <div className="shil-climate-box"><span>Ø§ÙØª Ø­Ø±Ø§Ø±ØªÛŒ</span><strong>{assessment.thermalDeratePercent}%</strong></div>
            <div className="shil-climate-box"><span>Ø±ÛŒØ³Ú© Ø®ÙˆØ±Ø¯Ú¯ÛŒ</span><strong>{assessment.corrosionRisk}</strong></div>
            <div className="shil-climate-box"><span>Ø¯Ø±Ø¬Ù‡ Ø­ÙØ§Ø¸Øª</span><strong>{assessment.recommendedIngressProtection}</strong></div>
            <div className="shil-climate-box"><span>ÙˆØ¶Ø¹ÛŒØª Ø¨Ø±Ø±Ø³ÛŒ</span><strong>{assessment.status === "ready" ? "Ø¢Ù…Ø§Ø¯Ù‡" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ"}</strong></div>
          </div>
          {assessment.warnings.length ? (
            <div className="shil-warning-list">
              {assessment.warnings.map((item, index) => <p key={index}>{item}</p>)}
            </div>
          ) : <small className="shil-env-hint">Ù‡ÛŒÚ† Ù‡Ø´Ø¯Ø§Ø± Ù…Ø­ÛŒØ·ÛŒ Ø¬Ø¯ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.</small>}
        </section>

        <section className="shil-env-card">
          <h3 className="shil-section-title">Ø®Ù„Ø§ØµÙ‡</h3>
          <div className="shil-climate-grid">
            <div className="shil-climate-box"><span>Ø´Ù‡Ø±</span><strong>{city || "Ø§ØµÙÙ‡Ø§Ù†"}</strong></div>
            <div className="shil-climate-box"><span>Ø§Ø³ØªØ§Ù†</span><strong>{selectedCity?.province || "Ø§ØµÙÙ‡Ø§Ù†"}</strong></div>
            <div className="shil-climate-box"><span>Ø¯Ù…Ø§ÛŒ Ù…ÛŒØ§Ù†Ú¯ÛŒÙ†</span><strong>{climate.temperature}Â°C</strong></div>
            <div className="shil-climate-box"><span>Ø¨Ø§Ø²Ù‡ Ø¯Ù…Ø§ÛŒÛŒ</span><strong>{climate.temperatureMinC} ØªØ§ {climate.temperatureMaxC}Â°C</strong></div>
            <div className="shil-climate-box"><span>Ø§Ø±ØªÙØ§Ø¹</span><strong>{climate.altitude}m</strong></div>
            <div className="shil-climate-box"><span>Ø±Ø·ÙˆØ¨Øª</span><strong>{climate.humidity}%</strong></div>
            <div className="shil-climate-box"><span>Ø³Ø§Ø¹Øª Ø¢ÙØªØ§Ø¨ÛŒ</span><strong>{climate.peakSunHours}</strong></div>
            <div className="shil-climate-box"><span>Ø¶Ø±ÛŒØ¨ Ø¢Ù„ÙˆØ¯Ú¯ÛŒ</span><strong>{activeInstallType.soiling}%</strong></div>
            <div className="shil-climate-box"><span>ØªØµØ§ÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨</span><strong>{siteAttachments.length} ÙØ§ÛŒÙ„</strong></div>
            <div className="shil-climate-box"><span>Ø¬Ù‡Øªâ€ŒÙ†Ù…Ø§</span><strong>{compassAttachment ? "Ø«Ø¨Øª Ø´Ø¯" : "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"}</strong></div>
            <div className="shil-climate-box"><span>Ù…Ù†Ø¨Ø¹ Ø¯Ø§Ø¯Ù‡</span><strong>{manualOverride ? "ÙˆÛŒØ±Ø§ÛŒØ´ Ø¯Ø³ØªÛŒ" : "Ø¨Ø§Ù†Ú© Ø´Ù‡Ø±"}</strong></div>
          </div>
        </section>

        {validationMessage ? <div className="shil-env-error">{validationMessage}</div> : null}
        <button type="button" className="shil-primary-wide" onClick={confirmEnvironment}>ØªØ£ÛŒÛŒØ¯ Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ Ùˆ Ø§Ø¯Ø§Ù…Ù‡ Ø¨Ù‡ Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡</button>
      </div>
    </ShilPageShell>
  );
}
