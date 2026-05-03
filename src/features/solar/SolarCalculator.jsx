import { useState } from "react";

const toEnglishNumber = (value) => {
  return String(value)
    .replace(/۰/g, "0")
    .replace(/۱/g, "1")
    .replace(/۲/g, "2")
    .replace(/۳/g, "3")
    .replace(/۴/g, "4")
    .replace(/۵/g, "5")
    .replace(/۶/g, "6")
    .replace(/۷/g, "7")
    .replace(/۸/g, "8")
    .replace(/۹/g, "9");
};

export default function SolarCalculator({ onSave }) {
  const [consumption, setConsumption] = useState("");
  const [sunHours, setSunHours] = useState("5");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const calculate = (e) => {
    e.preventDefault();

    const daily = Number(toEnglishNumber(consumption));
    const sun = Number(toEnglishNumber(sunHours));

    if (!daily || !sun) {
      alert("مصرف روزانه و ساعت تابش را وارد کنید");
      return;
    }

    const panelPower = 550;
    const inverterEfficiency = 0.9;
    const batteryVoltage = 48;

    const dailyWh = daily * 1000;

    const systemSizeKW = dailyWh / (sun * 1000 * inverterEfficiency);

    const panels = Math.ceil((systemSizeKW * 1000) / panelPower);

    const batteryAh = dailyWh / batteryVoltage;
    const batteryCapacity = Math.ceil(batteryAh / 100) * 100;

    setResult({
      dailyConsumptionKWh: daily,
      sunHours: sun,
      panelPower,
      inverterEfficiency,
      batteryVoltage,
      systemSizeKW: systemSizeKW.toFixed(2),
      panels,
      batteryCapacity,
    });
  };

  const saveResult = async () => {
    if (!result) return;

    if (!onSave) {
      alert("تابع ذخیره‌سازی به ماشین حساب وصل نشده است");
      return;
    }

    setSaving(true);
    await onSave(result);
    setSaving(false);

    alert("محاسبه ذخیره شد");
  };

  return (
    <div>
      <h3>ماشین حساب خورشیدی</h3>

      <form onSubmit={calculate}>
        <input
          placeholder="مصرف روزانه (kWh)"
          value={consumption}
          onChange={(e) => setConsumption(e.target.value)}
        />

        <input
          placeholder="ساعت تابش"
          value={sunHours}
          onChange={(e) => setSunHours(e.target.value)}
        />

        <button type="submit">محاسبه</button>
      </form>

      {result && (
        <div style={{ marginTop: 20 }}>
          <p>⚡ توان سیستم: {result.systemSizeKW} kW</p>
          <p>🔋 تعداد پنل: {result.panels}</p>
          <p>🔋 ظرفیت باتری: {result.batteryCapacity} Ah</p>

          <button type="button" onClick={saveResult} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره محاسبه"}
          </button>
        </div>
      )}
    </div>
  );
}