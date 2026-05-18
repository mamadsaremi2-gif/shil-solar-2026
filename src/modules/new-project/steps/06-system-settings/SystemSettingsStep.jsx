import { useMemo } from "react";
import { runSolarAutoDesign } from "../../../../core/calculation/solarAutoDesignEngine.js";
import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS } from "../../../../data/shilSolarBanks.js";

export function SystemSettingsStep({ value = {}, onChange = () => {} }) {
  const design = useMemo(() => runSolarAutoDesign({ load: value.load || {}, environment: value.environment || {}, settings: value }), [value]);
  const set = (key, next) => onChange(key, next);
  return (
    <div className="shil-card-stack shil-system-settings-mini">
      <div className="shil-section-card"><div className="shil-section-head"><h2>بانک‌های انتخاب تجهیزات</h2><span>SHIL</span></div><div className="shil-form-grid">
        <label><span>اینورتر خورشیدی</span><select value={value.inverterId || design.inverter.id} onChange={(e) => set("inverterId", e.target.value)}>{SHIL_SOLAR_INVERTERS.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}</select></label>
        <label><span>تعداد اینورتر</span><input type="number" min="1" value={value.inverterCount || design.inverter.count} onChange={(e) => set("inverterCount", e.target.value)} /></label>
        <label><span>باتری</span><select value={value.batteryId || design.battery.battery.id} onChange={(e) => set("batteryId", e.target.value)}>{SHIL_LITHIUM_BATTERIES.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
        <label><span>تعداد باتری</span><input type="number" min="1" value={value.batteryCount || design.battery.totalCount} onChange={(e) => set("batteryCount", e.target.value)} /></label>
        <label><span>پنل خورشیدی</span><select value={value.panelId || design.panel.id} onChange={(e) => set("panelId", e.target.value)}>{SHIL_SOLAR_PANELS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label><span>تعداد پنل</span><input type="number" min="1" value={value.panelCount || design.pvArray.panelCount} onChange={(e) => set("panelCount", e.target.value)} /></label>
      </div></div>
      <div className="shil-section-card"><div className="shil-section-head"><h2>خروجی هوشمند</h2><span>{design.valid ? "OK" : "Warning"}</span></div><div className="shil-result-grid"><div><span>اینورتر</span><strong>{design.inverter.count} عدد</strong></div><div><span>باتری</span><strong>{design.battery.seriesCount} سری × {design.battery.parallelCount} موازی</strong></div><div><span>پنل</span><strong>{design.pvArray.seriesCount} سری × {design.pvArray.parallelCount} موازی</strong></div><div><span>فضا</span><strong>{design.space.maintenanceAreaM2} m²</strong></div></div>{design.warnings.map((w) => <div className="shil-inline-warning" key={w}>{w}</div>)}</div>
    </div>
  );
}
