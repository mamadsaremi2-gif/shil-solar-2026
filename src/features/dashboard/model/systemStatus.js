export function canUseLocalStorage() {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__shil_storage_healthcheck__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

export function buildSystemStatus({ isOnline, isConfigured, isOfflineMode, localStorageReady, cloudState }) {
  if (!localStorageReady) {
    return {
      tone: "danger",
      title: "خطای ذخیره",
      detail: "ذخیره محلی مرورگر در دسترس نیست.",
      meta: "Local storage error",
    };
  }

  if (!isOnline || isOfflineMode) {
    return {
      tone: "warning",
      title: "آفلاین",
      detail: "پروژه‌ها روی همین دستگاه ذخیره می‌شوند.",
      meta: "Offline local mode",
    };
  }

  if (!isConfigured) {
    return {
      tone: "neutral",
      title: "محلی",
      detail: "ذخیره محلی فعال است؛ اتصال ابری تنظیم نشده.",
      meta: "Local mode",
    };
  }

  if (cloudState === "checking") {
    return {
      tone: "info",
      title: "در حال بررسی",
      detail: "در حال بررسی اتصال سرور و ذخیره‌سازی ابری.",
      meta: "Checking cloud",
    };
  }

  if (cloudState === "connected") {
    return {
      tone: "success",
      title: "آنلاین",
      detail: "اتصال سرور برقرار است و ذخیره محلی هم آماده است.",
      meta: "Cloud connected",
    };
  }

  return {
    tone: "warning",
    title: "سرور نامطمئن",
    detail: "اینترنت فعال است، اما اتصال ابری تأیید نشد؛ ذخیره محلی فعال است.",
    meta: "Cloud fallback",
  };
}
