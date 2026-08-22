export const EMERGENCY_BASE_LOAD_HOURS = 1;
export const EMERGENCY_DEFAULT_BACKUP_HOURS = 3;
export const EMERGENCY_MIN_BACKUP_HOURS = 1;
export const EMERGENCY_MAX_BACKUP_HOURS = 24;

export function clampEmergencyBackupHours(value, fallback = EMERGENCY_DEFAULT_BACKUP_HOURS) {
  const raw = String(value ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g, ".").replace(/٬|,/g, "").trim();
  const parsed = raw === "" ? Number.NaN : Number(raw);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(EMERGENCY_MIN_BACKUP_HOURS, Math.min(EMERGENCY_MAX_BACKUP_HOURS, safe));
}

export function emergencyBackupEnergyWh(effectivePowerW, backupHours) {
  return Math.round(Math.max(0, Number(effectivePowerW || 0)) * clampEmergencyBackupHours(backupHours));
}
