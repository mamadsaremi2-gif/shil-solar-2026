import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';

export const validationRule = Object.freeze({
  id: 'validation',
  title: 'اعتبارسنجی ورودی‌های پایه',
  version: '1.0.0',
  run(input = {}, result = {}) {
    const normalized = normalizeEngineeringInput(input);
    const warnings = [];
    const errors = [];

    if (normalized.peakLoadW <= 0) warnings.push({ code: 'MISSING_PEAK_LOAD', message: 'توان پیک مصرف وارد نشده است.' });
    if (normalized.dailyEnergyKWh <= 0 && normalized.peakLoadW <= 0) warnings.push({ code: 'MISSING_ENERGY', message: 'مصرف روزانه یا توان مصرفی برای محاسبه دقیق لازم است.' });
    if (normalized.scenario !== 'ongrid' && normalized.backupHours <= 0) warnings.push({ code: 'MISSING_BACKUP_HOURS', message: 'مدت پشتیبانی باتری مشخص نشده است.' });

    return {
      ok: errors.length === 0,
      mode: 'ACTIVE_ENGINE',
      calculationsEnabled: true,
      normalizedInput: normalized,
      values: {
        ...(result.values || {}),
        scenario: normalized.scenario,
        dailyEnergyKWh: normalized.dailyEnergyKWh,
        peakLoadW: normalized.peakLoadW,
        backupHours: normalized.backupHours,
        sunHours: normalized.sunHours,
      },
      warnings,
      errors,
      explanations: [{ rule: 'validation', message: 'ورودی‌ها نرمال‌سازی و برای اجرای قوانین بعدی آماده شدند.' }],
    };
  },
});
