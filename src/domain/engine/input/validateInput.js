import { isBatteryVoltageCompatible } from "../rules/engineeringRules.js";
const BACKUP_SYSTEM_VOLTAGES = [12, 24, 48, 96];

export function validateInput(form) {
  const errors = {};
  if (!form.projectTitle?.trim()) errors.projectTitle = "عنوان پروژه الزامی است.";
  if (!form.systemType) errors.systemType = "نوع سیستم را انتخاب کنید.";
  if (!form.calculationMode) errors.calculationMode = "روش محاسبه را انتخاب کنید.";
  if (!(Number(form.systemVoltage) > 0)) errors.systemVoltage = "ولتاژ سیستم نامعتبر است.";
  if (form.systemType === "backup" && !BACKUP_SYSTEM_VOLTAGES.includes(Number(form.systemVoltage))) {
    errors.systemVoltage = "در حالت برق اضطراری فقط 12، 24، 48 یا 96 ولت مجاز است.";
  }
  if (form.systemType !== "gridtie" && !isBatteryVoltageCompatible(Number(form.systemVoltage), Number(form.batteryUnitVoltage))) {
    errors.batteryUnitVoltage = "ولتاژ باتری با کلاس ولتاژ اینورتر/سیستم همخوانی اجرایی ندارد.";
  }

  if (form.calculationMode === "current" && !(Number(form.current) > 0)) {
    errors.current = "جریان کل باید بیشتر از صفر باشد.";
  }
  if (form.calculationMode === "power" && !(Number(form.loadPower) > 0)) {
    errors.loadPower = "توان کل باید بیشتر از صفر باشد.";
  }
  if (form.calculationMode === "daily_energy" && !(Number(form.dailyEnergyKwh) > 0)) {
    errors.dailyEnergyKwh = "انرژی روزانه باید بیشتر از صفر باشد.";
  }
  if (form.calculationMode === "loads") {
    const valid = (form.loadItems || []).some((item) => Number(item.qty) > 0 && Number(item.power) > 0);
    if (!valid) errors.loadItems = "حداقل یک بار معتبر لازم است.";
  }
  if (form.calculationMode === "load_profile") {
    const validProfile = (form.loadProfile || []).length === 24 && (form.loadProfile || []).some((slot) => Number(slot.factor) > 0);
    if (!validProfile) errors.loadProfile = "پروفایل مصرف باید 24 ساعت معتبر داشته باشد.";
    if (!(Number(form.dailyEnergyKwh) > 0)) errors.dailyEnergyKwh = "برای پروفایل مصرف، انرژی روزانه باید بیشتر از صفر باشد.";
  }
  if (["current", "power", "daily_energy", "load_profile"].includes(form.calculationMode) && !(Number(form.coincidenceFactor) > 0 && Number(form.coincidenceFactor) <= 1)) {
    errors.coincidenceFactor = "ضریب همزمانی باید بین 0.1 و 1 باشد.";
  }
  if (form.systemType !== "backup" && !(Number(form.sunHours) > 0)) {
    errors.sunHours = "برای سیستم‌های دارای پنل، ساعات تابش الزامی است.";
  }
  return errors;
}
