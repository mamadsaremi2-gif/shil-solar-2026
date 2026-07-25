import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import SmartCityInput, { findIranCityByName, getDefaultIranCity } from "../../components/SmartCityInput";
import { analyzeEnvironmentForEngineering, analyzeInstallationArrays, estimateRecommendedTilt, normalizePersianNumber } from "../../core/environment/environmentAssessment.js";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { clearScenarioFlow, isScenarioFlowFor } from "../../workflow/flowIsolation.js";

const directionOptions = [
  { key: "north", label: "شمال", deg: 0 },
  { key: "east", label: "شرق", deg: 90 },
  { key: "south", label: "جنوب", deg: 180 },
  { key: "west", label: "غرب", deg: 270 },
];
const defaultDirectionSlots = { north: "north", east: "east", south: "south", west: "west" };
function toNumberInput(value, fallback = 0) {
const n = Number(normalizePersianNumber(value)); return Number.isFinite(n) ? n : fallback; }
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
  useEffect(() => {
    document.body.classList.add("shil-environment-unified-screen");

    const validateConfirm = () => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const confirmButton = buttons.find((btn) => btn.classList.contains("shil-primary-wide")) || buttons[buttons.length - 1];
      if (!confirmButton) return;

      const fields = Array.from(document.querySelectorAll("input, select, textarea"));
      const filled = fields.filter((el) => String(el.value || "").trim().length > 0).length;

      confirmButton.disabled = filled < 3;
    };

    setTimeout(validateConfirm, 300);
    document.addEventListener("input", validateConfirm);
    document.addEventListener("change", validateConfirm);

    return () => {
      document.body.classList.remove("shil-environment-unified-screen");
      document.removeEventListener("input", validateConfirm);
      document.removeEventListener("change", validateConfirm);
    };
  }, []);
const navigate = useNavigate();
  const { domain = localStorage.getItem("shil:scenarioDomain") || "solar" } = useParams();

  const environmentDraftKey = useMemo(() => {
    const projectKey = localStorage.getItem("shil:activeProjectKey") || "active-draft";
    return `shil:environment-state:v3:${projectKey}:${domain}`;
  }, [domain]);

  const persistedEnvironment = useMemo(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem(environmentDraftKey) ||
        localStorage.getItem("shil:environmentDraft") ||
        "null"
      ) || {};

      const normalizedClimate = raw.climate || {
        temperature: raw.temperatureAverageC ?? raw.temperature ?? defaultClimate.temperature,
        temperatureMinC: raw.temperatureMinC ?? defaultClimate.temperatureMinC,
        temperatureMaxC: raw.temperatureMaxC ?? defaultClimate.temperatureMaxC,
        altitude: raw.altitude ?? defaultClimate.altitude,
        humidity: raw.humidity ?? defaultClimate.humidity,
        peakSunHours: raw.peakSunHours ?? defaultClimate.peakSunHours,
        latitude: raw.latitude ?? defaultClimate.latitude,
        longitude: raw.longitude ?? defaultClimate.longitude,
      };

      return {
        ...raw,
        climate: normalizedClimate,
        installTiltDeg: raw.installTiltDeg ?? raw.selectedTiltDeg ?? raw.recommendedTiltDeg,
        installAzimuthDeg: raw.installAzimuthDeg ?? raw.selectedAzimuthDeg ?? raw.recommendedAzimuthDeg,
      };
    } catch {
      return {};
    }
  }, [environmentDraftKey]);
  const [city, setCity] = useState(persistedEnvironment.city || isfahan?.name || "اصفهان");
  const [selectedCity, setSelectedCity] = useState(() => findIranCityByName(persistedEnvironment.city) || isfahan || null);
  const [manualOverride, setManualOverride] = useState(Boolean(persistedEnvironment.manualOverride));
  const [address, setAddress] = useState(persistedEnvironment.address || "");
  const [gpsMode, setGpsMode] = useState(persistedEnvironment.gpsMode || "auto");
  const [latitude, setLatitude] = useState(String(persistedEnvironment.latitude ?? defaultClimate.latitude));
  const [longitude, setLongitude] = useState(String(persistedEnvironment.longitude ?? defaultClimate.longitude));
  const [installType, setInstallType] = useState(persistedEnvironment.installType || "urban");
  const [manualClimate, setManualClimate] = useState(() => persistedEnvironment.climate || cityToClimate(isfahan, domain, persistedEnvironment.installType || "urban"));
  const [compassAttachment, setCompassAttachment] = useState(null);
  const [siteAttachments, setSiteAttachments] = useState([]);
  const [compassPreview, setCompassPreview] = useState("");
  const [sitePreviews, setSitePreviews] = useState([]);
  const [activeSitePreview, setActiveSitePreview] = useState("");
  const [savedSiteImageCount, setSavedSiteImageCount] = useState(() => Number(localStorage.getItem("shil:environmentSiteImageCount") || 0));
  const [savedCompassImage, setSavedCompassImage] = useState(() => localStorage.getItem("shil:environmentCompassSaved") === "true");
  const [compassUploadChoice, setCompassUploadChoice] = useState("ask");
  const [gpsStatus, setGpsStatus] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [installTiltDeg, setInstallTiltDeg] = useState(String(persistedEnvironment.installTiltDeg ?? estimateRecommendedTilt(defaultClimate.latitude)));
  const [installAzimuthDeg, setInstallAzimuthDeg] = useState(String(persistedEnvironment.installAzimuthDeg ?? 180));
  const [installationMode, setInstallationMode] = useState(persistedEnvironment.installationMode === "multi" ? "multi" : "single");
  const [installationArrays, setInstallationArrays] = useState(() => {
    const saved = Array.isArray(persistedEnvironment.installationArrays) ? persistedEnvironment.installationArrays : [];
    if (saved.length) return saved.slice(0, 4);
    return [
      { id: "array-1", title: "آرایه ۱", panelCount: 10, panelPower: 550, azimuth: 90, tilt: 20, enabled: true },
      { id: "array-2", title: "آرایه ۲", panelCount: 10, panelPower: 550, azimuth: 270, tilt: 20, enabled: true },
    ];
  });
  const [directionSlots, setDirectionSlots] = useState(persistedEnvironment.directionSlots || defaultDirectionSlots);

  const shilMapPinPosition = useMemo(() => {
    const toSafeNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const normalized = typeof value === "string" ? normalizePersianNumber(value) : value;
      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    };

    const lat =
      toSafeNumber(latitude) ??
      toSafeNumber(selectedCity?.latitude) ??
      toSafeNumber(manualClimate?.latitude) ??
      toSafeNumber(defaultClimate?.latitude);

    const lng =
      toSafeNumber(longitude) ??
      toSafeNumber(selectedCity?.longitude) ??
      toSafeNumber(selectedCity?.lng) ??
      toSafeNumber(selectedCity?.lon) ??
      toSafeNumber(manualClimate?.longitude) ??
      toSafeNumber(defaultClimate?.longitude);

    if (lat === null || lng === null) {
      return { x: 50, y: 42 };
    }

    const minLat = 25.0;
    const maxLat = 40.2;
    const minLng = 44.0;
    const maxLng = 63.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  }, [latitude, longitude, selectedCity, manualClimate]);

  const shilMapPinLabel = selectedCity?.name || city || "موقعیت انتخابی";


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

  useEffect(() => {
    const payload = {
      ...persistedEnvironment, domain, city, province: selectedCity?.province || "",
      address, gpsMode, latitude, longitude, installType, climate: manualClimate,
      installTiltDeg, installAzimuthDeg, installationMode, installationArrays, directionSlots, manualOverride,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(environmentDraftKey, JSON.stringify(payload));
    localStorage.setItem("shil:environmentDraft", JSON.stringify(payload));
  }, [domain, city, selectedCity, address, gpsMode, latitude, longitude, installType,
      manualClimate, installTiltDeg, installAzimuthDeg, installationMode, installationArrays, directionSlots, manualOverride]);

  const singleAssessment = useMemo(() => analyzeEnvironmentForEngineering({
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

  const multiArrayAssessment = useMemo(() => analyzeInstallationArrays({
    environment: {
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
      directionSlots,
      compassAttachment,
      siteAttachments,
      siteAttachment: siteAttachments[0] || null,
    },
    arrays: installationArrays,
  }), [domain, city, selectedCity, address, gpsMode, latitude, longitude, activeInstallType, climate, directionSlots, compassAttachment, siteAttachments, installationArrays]);

  const assessment = installationMode === "multi" ? multiArrayAssessment.combinedAssessment : singleAssessment;
  const installationArrayResults = multiArrayAssessment.arrayResults;

  const updateInstallationArray = (id, patch) => {
    setInstallationArrays((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addInstallationArray = () => {
    setInstallationArrays((prev) => {
      if (prev.length >= 4) return prev;
      const nextIndex = prev.length + 1;
      return [...prev, {
        id: `array-${Date.now()}`,
        title: `آرایه ${nextIndex}`,
        panelCount: 1,
        panelPower: Number(prev[0]?.panelPower || 550),
        azimuth: 180,
        tilt: Number(prev[0]?.tilt || estimateRecommendedTilt(latitude)),
        enabled: true,
      }];
    });
  };

  const removeInstallationArray = (id) => {
    setInstallationArrays((prev) => prev.length <= 1 ? prev : prev.filter((item) => item.id !== id));
  };

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
    const availableSlots = Math.max(0, 6 - sitePreviews.length);
    const files = Array.from(event.target.files || []).slice(0, availableSlots);

    if (!files.length) {
      event.target.value = "";
      return;
    }

    const nextAttachments = files
      .map((file) => fileToAttachment(file, "site-photo", latitude, longitude))
      .filter(Boolean);

    setSiteAttachments((prev) => [...prev, ...nextAttachments].slice(0, 6));

    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    }))).then((nextPreviews) => {
      setSitePreviews((prev) => [...prev, ...nextPreviews].slice(0, 6));
    });

    event.target.value = "";
  };

  const removeSiteImage = (index) => {
    setSitePreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setSiteAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
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

  const environmentReady = Boolean(
    city.trim() &&
    String(latitude || "").trim() &&
    String(longitude || "").trim() &&
    installType
  );

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
      installationMode,
      installationArrays: installationMode === "multi" ? installationArrayResults.map(({ assessment: arrayAssessment, ...item }) => ({ ...item, assessment: arrayAssessment })) : [],
      installationArraySummary: installationMode === "multi" ? multiArrayAssessment.summary : null,
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

    const persistentEnvironmentDraft = {
      ...environmentDraft,
      climate: {
        temperature: climate.temperature,
        temperatureMinC: climate.temperatureMinC,
        temperatureMaxC: climate.temperatureMaxC,
        altitude: climate.altitude,
        humidity: climate.humidity,
        peakSunHours: climate.peakSunHours,
        latitude: lat,
        longitude: lng,
      },
      installTiltDeg: assessment.selectedTiltDeg,
      installAzimuthDeg: assessment.selectedAzimuthDeg,
      installationMode,
      installationArrays,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(environmentDraftKey, JSON.stringify(persistentEnvironmentDraft));
    localStorage.setItem("shil:environmentDraft", JSON.stringify(persistentEnvironmentDraft));
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
      <div id="shil-environment-unified-root" className="shil-env-page shil-env-page--unified">
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
          <div className="shil-map-container shil-env-location-map shil-map-container"><img src="/assets/shil/map/iran-heatmap.webp" alt="Iran heating system map" />
            <div
              className="shil-map-pin"
              style={{
                left: `${shilMapPinPosition.x}%`,
                top: `${shilMapPinPosition.y}%`,
              }}
              aria-label={shilMapPinLabel}
            >
              <span className="shil-map-pin-core" />
              <span className="shil-map-pin-radar" />
            </div>
            <div
              className="shil-map-label"
              style={{
                left: `${shilMapPinPosition.x}%`,
                top: `${shilMapPinPosition.y}%`,
              }}
            >
              {shilMapPinLabel}
            </div>

</div>
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

          {domain === "solar" ? (
            <div className="shil-installation-mode-switch" role="group" aria-label="نوع چیدمان پنل‌ها">
              <button type="button" className={installationMode === "single" ? "active" : ""} onClick={() => setInstallationMode("single")}>یک جهت</button>
              <button type="button" className={installationMode === "multi" ? "active" : ""} onClick={() => setInstallationMode("multi")}>چند جهت</button>
            </div>
          ) : null}

          {installationMode === "single" ? (
            <>
              <div className="shil-manual-climate-grid shil-orientation-input-grid">
                <div className="shil-field"><label>جهت نصب پنل °</label><input className="shil-input" value={installAzimuthDeg} onChange={(event) => setInstallAzimuthDeg(event.target.value)} inputMode="decimal" placeholder="پیش‌فرض 180 جنوب" /><small className="shil-env-hint">0 شمال، 90 شرق، 180 جنوب، 270 غرب؛ این عدد در راندمان و تلفات اعمال می‌شود.</small></div>
                <div className="shil-field"><label>زاویه نصب پنل °</label><input className="shil-input" value={installTiltDeg} onChange={(event) => setInstallTiltDeg(event.target.value)} inputMode="decimal" placeholder={`پیشنهادی ${assessment.recommendedTiltDeg}°`} /><small className="shil-env-hint">عدد دستی کاربر جایگزین زاویه پیشنهادی و وارد موتور محاسبات می‌شود.</small></div>
              </div>
            </>
          ) : (
            <div className="shil-installation-arrays">
              {installationArrayResults.map((item, index) => (
                <article className="shil-installation-array-card" key={item.id}>
                  <div className="shil-installation-array-head">
                    <input className="shil-input" value={item.title} onChange={(event) => updateInstallationArray(item.id, { title: event.target.value })} aria-label={`نام آرایه ${index + 1}`} />
                    <button type="button" className="shil-array-remove" onClick={() => removeInstallationArray(item.id)} disabled={installationArrays.length <= 1}>حذف</button>
                  </div>
                  <div className="shil-array-fields">
                    <label>تعداد پنل<input className="shil-input" inputMode="numeric" min="1" value={item.panelCount} onChange={(event) => updateInstallationArray(item.id, { panelCount: event.target.value })} /></label>
                    <label>توان هر پنل W<input className="shil-input" inputMode="numeric" min="1" value={item.panelPower} onChange={(event) => updateInstallationArray(item.id, { panelPower: event.target.value })} /></label>
                    <label>جهت °<input className="shil-input" inputMode="decimal" value={item.azimuth} onChange={(event) => updateInstallationArray(item.id, { azimuth: event.target.value })} /></label>
                    <label>زاویه °<input className="shil-input" inputMode="decimal" value={item.tilt} onChange={(event) => updateInstallationArray(item.id, { tilt: event.target.value })} /></label>
                  </div>
                  <div className="shil-array-result-row">
                    <span>افت جهت <strong>{item.assessment.orientationLossPercent}%</strong></span>
                    <span>افت زاویه <strong>{item.assessment.tiltLossPercent}%</strong></span>
                    <span>راندمان <strong>{Math.round((item.assessment.effectiveEfficiency || 1) * 100)}%</strong></span>
                  </div>
                </article>
              ))}
              <button type="button" className="shil-add-array-button" onClick={addInstallationArray} disabled={installationArrays.length >= 4}>+ افزودن آرایه نصب</button>
              <small className="shil-env-hint">در این نسخه هر آرایه با همان موتور فعلی جداگانه محاسبه می‌شود و نتیجه کل بر اساس توان نصب‌شده وزن‌دهی می‌شود. تخصیص MPPT تغییری نکرده است.</small>
            </div>
          )}
          <div className="shil-climate-grid shil-orientation-factor-grid"><div className="shil-climate-box"><span>{installationMode === "multi" ? "افت ترکیبی جهت" : "افت جهت"}</span><strong>{assessment.orientationLossPercent}%</strong></div><div className="shil-climate-box"><span>{installationMode === "multi" ? "افت ترکیبی زاویه" : "افت زاویه"}</span><strong>{assessment.tiltLossPercent}%</strong></div><div className="shil-climate-box"><span>ضریب جهت/زاویه</span><strong>{Math.round((assessment.orientationEfficiency || 1) * 100)}%</strong></div><div className="shil-climate-box"><span>راندمان نهایی محیطی</span><strong>{Math.round((assessment.effectiveEfficiency || 1) * 100)}%</strong></div></div>
          {installationMode === "multi" ? <div className="shil-array-summary"><span>تعداد آرایه: <strong>{multiArrayAssessment.summary.arrayCount}</strong></span><span>تعداد کل پنل: <strong>{multiArrayAssessment.summary.totalPanelCount}</strong></span><span>توان نصب‌شده: <strong>{(multiArrayAssessment.summary.totalInstalledPowerW / 1000).toFixed(2)} kW</strong></span></div> : null}

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

            <div className="shil-upload-box shil-site-upload-box">
              <span>تصاویر محل نصب</span>
              <input type="file" accept="image/*" multiple onChange={handleSiteUpload} />
              <small className="shil-env-hint">حداکثر ۶ تصویر؛ عکس جدید به گالری اضافه می‌شود.</small>

              {sitePreviews.length ? (
                <div className="shil-site-preview-grid shil-site-preview-contain-grid">
                  {sitePreviews.map((src, index) => (
                    <figure key={index} className="shil-site-preview-card">
                      <button type="button" className="shil-site-preview-open" onClick={() => setActiveSitePreview(src)}>
                        <img src={src} alt={`Site preview ${index + 1}`} />
                      </button>
                      <figcaption>تصویر {index + 1}</figcaption>
                      <button type="button" className="shil-site-preview-remove" onClick={() => removeSiteImage(index)}>حذف</button>
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
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

        {activeSitePreview ? (
          <div className="shil-image-lightbox" role="dialog" aria-modal="true" onClick={() => setActiveSitePreview("")}>
            <button type="button" className="shil-image-lightbox-close" onClick={() => setActiveSitePreview("")}>×</button>
            <img src={activeSitePreview} alt="نمایش تصویر محل نصب" />
          </div>
        ) : null}

        {validationMessage ? <div className="shil-env-error">{validationMessage}</div> : null}

        <div
          className="shil-env-content-confirm-slot"
          aria-label="تأیید شرایط محیطی"
        >
          <ShilPrimaryButton
            className="shil-env-content-confirm-button"
            disabled={!environmentReady}
            onClick={confirmEnvironment}
            label="تأیید محیط"
          />
        </div>
      </div>
    </ShilPageShell>
  );
}

