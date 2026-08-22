export const ADMIN_COMMAND_CENTER_VERSION = "4.0.0";

function bool(value) { return Boolean(value); }
function arrayOk(value) { return Array.isArray(value) ? value.length === 0 : bool(value?.ok ?? true); }

export function buildAdminReadiness({
  health,
  cloudStatus,
  recoveryState,
  securitySummary,
  managedProfileSummary,
  releaseValidation,
  diagnostics,
  emergencyLocalAdmin,
  adminCredentials,
  authType,
} = {}) {
  const onlineAdmin = authType === "supabase" && !emergencyLocalAdmin;
  const credentialsConfigured = Array.isArray(adminCredentials) && adminCredentials.some((item) => item?.login && item?.configured !== false);
  const openDiagnostics = Array.isArray(diagnostics)
    ? diagnostics.filter((item) => !["resolved", "closed"].includes(String(item?.status || "").toLowerCase())).length
    : 0;
  const releaseOk = arrayOk(releaseValidation?.errors) && releaseValidation?.ok !== false;

  const checks = [
    { key: "runtime", title: "سلامت Runtime", ok: health?.ok !== false, required: true, detail: health?.ok !== false ? "Validation اصلی پایدار است" : `${health?.warnings?.length || 1} هشدار فعال` },
    { key: "auth", title: "احراز هویت ادمین", ok: onlineAdmin || credentialsConfigured, required: true, detail: onlineAdmin ? "Admin آنلاین Supabase" : credentialsConfigured ? "Emergency Local Admin آماده است" : "Credential ادمین پیکربندی نشده" },
    { key: "cloud", title: "اتصال Cloud", ok: onlineAdmin ? bool(cloudStatus?.online) : true, required: onlineAdmin, detail: onlineAdmin ? (cloudStatus?.online ? "Supabase در دسترس است" : "Cloud در دسترس نیست") : "برای Local Admin الزامی نیست" },
    { key: "recovery", title: "Recovery Code", ok: bool(recoveryState?.configured), required: true, detail: recoveryState?.configured ? "بازیابی امن فعال است" : "قبل از Production فعال شود" },
    { key: "sessions", title: "Security Session Registry", ok: onlineAdmin ? Number(securitySummary?.events || 0) >= 0 : true, required: onlineAdmin, detail: onlineAdmin ? `${securitySummary?.active || 0} Session فعال · ${securitySummary?.failed || 0} ورود ناموفق` : "فقط برای Admin آنلاین" },
    { key: "users", title: "مدیریت کاربران Cloud", ok: onlineAdmin ? Number(managedProfileSummary?.total || 0) >= 0 : true, required: onlineAdmin, detail: onlineAdmin ? `${managedProfileSummary?.total || 0} Profile قابل مدیریت` : "در Emergency Local Admin غیرفعال" },
    { key: "release", title: "Engineering Release", ok: releaseOk, required: true, detail: releaseOk ? "Release validation معتبر است" : "Release نیاز به بررسی دارد" },
    { key: "diagnostics", title: "Diagnostics بحرانی", ok: openDiagnostics === 0, required: false, detail: openDiagnostics ? `${openDiagnostics} مورد باز نیازمند بررسی` : "مورد باز ثبت نشده" },
  ];

  const weighted = checks.filter((item) => item.required);
  const passed = weighted.filter((item) => item.ok).length;
  const score = weighted.length ? Math.round((passed / weighted.length) * 100) : 100;
  const blockers = checks.filter((item) => item.required && !item.ok);
  const warnings = checks.filter((item) => !item.required && !item.ok);

  return {
    score,
    ready: blockers.length === 0,
    mode: onlineAdmin ? "cloud-admin" : emergencyLocalAdmin ? "emergency-local" : "admin",
    checks,
    blockers,
    warnings,
    openDiagnostics,
  };
}

export function adminModuleBadge({ groupKey, health, managedProfileSummary, securitySummary, diagnostics, recoveryState, cloudStatus } = {}) {
  switch (groupKey) {
    case "monitoring": return health?.ok === false ? "هشدار" : "پایدار";
    case "people": return `${managedProfileSummary?.total || 0} کاربر`;
    case "security": return recoveryState?.configured ? `${securitySummary?.active || 0} Session` : "Recovery لازم";
    case "services": {
      const open = Array.isArray(diagnostics) ? diagnostics.filter((item) => !["resolved", "closed"].includes(String(item?.status || "").toLowerCase())).length : 0;
      return cloudStatus?.online ? `${open} خطا` : "Local";
    }
    default: return "آماده";
  }
}
