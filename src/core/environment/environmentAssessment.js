export const DEFAULT_SOLAR_AZIMUTH_DEG = 180;
export const DEFAULT_PANEL_TILT_FALLBACK_DEG = 32;

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clampNumber(value, min, max, fallback = min) {
  const number = toNumber(value, fallback);
  return Math.max(min, Math.min(max, number));
}

export function estimateRecommendedTilt(latitude) {
  const lat = Math.abs(toNumber(latitude, DEFAULT_PANEL_TILT_FALLBACK_DEG));
  if (!Number.isFinite(lat)) return DEFAULT_PANEL_TILT_FALLBACK_DEG;
  return Math.round(clampNumber(lat * 0.9, 15, 45, DEFAULT_PANEL_TILT_FALLBACK_DEG));
}

export function estimateThermalDeratePercent(maxTemperatureC) {
  const maxTemp = toNumber(maxTemperatureC, 40);
  if (maxTemp <= 35) return 0;
  if (maxTemp <= 42) return 2;
  if (maxTemp <= 47) return 4;
  return 6;
}

export function estimateCorrosionRisk({ humidity, installType }) {
  const h = toNumber(humidity, 30);
  if (installType === "coastal" || h >= 70) return "high";
  if (installType === "industrial" || h >= 55) return "medium";
  return "low";
}

export function estimateIngressProtection({ humidity, installType }) {
  const risk = estimateCorrosionRisk({ humidity, installType });
  if (risk === "high") return "IP65 / IP66";
  if (risk === "medium") return "IP54 / IP65";
  return "IP54";
}

export function buildEnvironmentWarnings(environment) {
  const warnings = [];
  const humidity = toNumber(environment.humidity, 30);
  const maxTemp = toNumber(environment.temperatureMaxC, 40);
  const minTemp = toNumber(environment.temperatureMinC, 0);
  const sun = toNumber(environment.peakSunHours, 0);
  const soiling = toNumber(environment.soilingLossPercent, 3);

  if (environment.domain === "solar" && sun < 4.2) {
    warnings.push("ساعت آفتابی مؤثر پایین است؛ تعداد پنل یا ظرفیت تولید باید با ضریب اطمینان بیشتر بررسی شود.");
  }
  if (maxTemp >= 45) {
    warnings.push("دمای بیشینه بالا است؛ افت حرارتی پنل/اینورتر در محاسبات لحاظ شود.");
  }
  if (minTemp <= -10) {
    warnings.push("حداقل دمای پایین است؛ ولتاژ مدار باز پنل در سرمای شدید کنترل شود.");
  }
  if (humidity >= 65 || environment.installType === "coastal") {
    warnings.push("رطوبت یا محیط ساحلی بالاست؛ تجهیزات ضدخوردگی و تابلو با IP بالاتر پیشنهاد می‌شود.");
  }
  if (soiling >= 6 || environment.installType === "desert" || environment.installType === "industrial") {
    warnings.push("آلودگی/گردوغبار قابل توجه است؛ برنامه شست‌وشوی پنل و ضریب Soiling لحاظ شود.");
  }
  if (!environment.compassAttachment) {
    warnings.push("اسکرین‌شات قطب‌نما بارگذاری نشده؛ جهت نهایی پنل باید در بازدید محل تأیید شود.");
  }
  if (!environment.siteAttachment && environment.domain === "solar") {
    warnings.push("تصویر محل نصب بارگذاری نشده؛ ریسک سایه‌اندازی و محدودیت فضای نصب هنوز دستی بررسی می‌شود.");
  }
  return warnings;
}

export function analyzeEnvironmentForEngineering(environment = {}) {
  const domain = environment.domain || "solar";
  const recommendedTiltDeg = domain === "solar" ? estimateRecommendedTilt(environment.latitude) : 0;
  const recommendedAzimuthDeg = domain === "solar" ? DEFAULT_SOLAR_AZIMUTH_DEG : 0;
  const thermalDeratePercent = domain === "solar" ? estimateThermalDeratePercent(environment.temperatureMaxC) : 0;
  const corrosionRisk = estimateCorrosionRisk(environment);
  const recommendedIngressProtection = estimateIngressProtection(environment);
  const needsAntiCorrosion = corrosionRisk !== "low";
  const manualReviewRequired = Boolean(!environment.compassAttachment || (domain === "solar" && !environment.siteAttachment));
  const warnings = buildEnvironmentWarnings({ ...environment, domain });

  return {
    status: warnings.length ? "needs-review" : "ready",
    domain,
    recommendedTiltDeg,
    recommendedAzimuthDeg,
    thermalDeratePercent,
    corrosionRisk,
    recommendedIngressProtection,
    needsAntiCorrosion,
    manualReviewRequired,
    compassAnalysis: {
      mode: environment.compassAttachment ? "uploaded" : "not-provided",
      assumedSouthAzimuthDeg: recommendedAzimuthDeg,
      note: environment.compassAttachment
        ? "فایل قطب‌نما ذخیره شد؛ جهت جنوب به‌عنوان مبنای اولیه طراحی ثبت شده و در بازدید قابل اصلاح است."
        : "بدون تصویر قطب‌نما، جهت استاندارد جنوب برای ایران به‌صورت پیش‌فرض در نظر گرفته شد.",
    },
    siteImageAnalysis: {
      mode: environment.siteAttachment ? "uploaded" : "not-provided",
      shadingRisk: environment.siteAttachment ? "manual-review" : "unknown",
      note: environment.siteAttachment
        ? "تصویر محل نصب ذخیره شد؛ برای تشخیص دقیق سایه/مانع باید در مرحله AI Vision یا بازدید مهندسی بررسی شود."
        : "تصویر محل نصب موجود نیست؛ محاسبات با فرض نبود سایه مستقیم ادامه پیدا می‌کند.",
    },
    warnings,
  };
}
