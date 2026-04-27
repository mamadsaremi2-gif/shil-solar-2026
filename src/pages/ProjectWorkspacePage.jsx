import { useMemo, useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
import { WizardShell } from "../features/project-wizard/components/WizardShell";
import {
  SYSTEM_TYPES,
  CALCULATION_MODES,
  BATTERY_TYPES,
  SYSTEM_VOLTAGES,
  BACKUP_SYSTEM_VOLTAGES,
  BATTERY_UNIT_VOLTAGE_OPTIONS,
  BACKUP_BATTERY_CAPACITY_OPTIONS,
  LOAD_TYPES,
  HYBRID_MODES,
} from "../domain/models/project";
import { Field } from "../shared/components/Field";
import { CitySearch } from "../shared/components/CitySearch";
import { EquipmentRepository } from "../data/repositories/EquipmentRepository";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";
import { getSmartPresetsForSystem } from "../data/seed/smartProjectPresets";
import { IRAN_CITIES } from "../data/seed/iranCities";
import { parseFaNumber } from "../shared/utils/faNumbers";

function getCityClimate(cityName) {
  return IRAN_CITIES.find((city) => city.name === cityName) || null;
}

function ClimateInfoCard({ form }) {
  const city = getCityClimate(form.city);
  const temperatureRange = `${Number(form.minTemperature ?? 0)} تا ${Number(form.maxTemperature ?? 0)} °C`;
  const altitude = Number(form.altitude ?? 0);
  const psh = Number(form.sunHours ?? 0);
  const tempImpact = Number(form.maxTemperature ?? 25) > 40
    ? "دمای بالا؛ افت توان پنل در نظر گرفته شود"
    : Number(form.minTemperature ?? 0) < -5
      ? "دمای پایین؛ Voc سرد پنل کنترل شود"
      : "شرایط دمایی عادی برای طراحی";
  const solarClass = psh >= 5.7 ? "عالی" : psh >= 5 ? "خوب" : psh >= 4.2 ? "متوسط" : "کم";
  const altitudeNote = altitude > 1500
    ? "ارتفاع زیاد؛ تهویه اینورتر و تجهیزات مهم است"
    : altitude < 100
      ? "ارتفاع پایین؛ شرایط نصب معمولی"
      : "ارتفاع مناسب برای طراحی عمومی";

  return (
    <section className="panel panel--soft climate-info-card">
      <div className="panel__header">
        <div>
          <h3>اطلاعات محیطی شهر انتخابی</h3>
          <p className="section-note">این اطلاعات برای سیستم‌های دارای پنل خورشیدی در محاسبه تولید، دمای پنل، Voc سرد و شرایط نصب استفاده می‌شود.</p>
        </div>
        <span className="badge">{city ? city.province : "ورودی دستی"}</span>
      </div>
      <div className="climate-metric-grid">
        <div><span>شهر</span><strong>{form.city || "—"}</strong></div>
        <div><span>تابش موثر PSH</span><strong>{psh.toFixed(1)} h/day</strong></div>
        <div><span>کلاس تابش</span><strong>{solarClass}</strong></div>
        <div><span>دمای متوسط</span><strong>{Number(form.averageTemperature ?? 0).toFixed(0)} °C</strong></div>
        <div><span>بازه دمایی</span><strong>{temperatureRange}</strong></div>
        <div><span>ارتفاع</span><strong>{altitude.toFixed(0)} m</strong></div>
      </div>
      <div className="climate-note-list">
        <div><span>اثر دما</span><strong>{tempImpact}</strong></div>
        <div><span>اثر ارتفاع</span><strong>{altitudeNote}</strong></div>
      </div>
    </section>
  );
}


function StepProjectInfo() {
  const { activeProject, updateForm } = useProjectStore();
  const form = activeProject.form;
  return (
    <div className="form-grid two-cols">
      <Field label="عنوان پروژه"><input value={form.projectTitle} onChange={(e) => updateForm({ projectTitle: e.target.value })} /></Field>
      <Field label="نام کارفرما"><input value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} /></Field>
      <Field label="شهر" hint="با انتخاب شهر، داده‌های اقلیمی پایه به صورت خودکار در فرم اعمال می‌شود.">
        <CitySearch
          value={form.city}
          onSelect={(city) => updateForm({
            city: city.name,
            sunHours: city.sunHours,
            averageTemperature: city.averageTemperature,
            minTemperature: city.minTemperature,
            maxTemperature: city.maxTemperature,
            altitude: city.altitude,
          })}
        />
      </Field>
      <Field label="حالت طراحی">
        <select value={form.modeType} onChange={(e) => updateForm({ modeType: e.target.value })}>
          <option value="quick">Quick</option><option value="advanced">Advanced</option>
        </select>
      </Field>
    </div>
  );
}

function StepSystemType() {
  const { activeProject, updateForm } = useProjectStore();
  return (
    <div className="card-grid">
      {SYSTEM_TYPES.map((item) => (
        <button key={item.value} type="button" className={`choice-card ${activeProject.form.systemType === item.value ? "is-selected" : ""}`} onClick={() => updateForm({ systemType: item.value })}>
          <strong>{item.label}</strong><span>{item.description}</span>
        </button>
      ))}
    </div>
  );
}

function StepCalculationMode() {
  const { activeProject, updateForm } = useProjectStore();
  return (
    <div className="card-grid">
      {CALCULATION_MODES.map((item) => (
        <button key={item.value} type="button" className={`choice-card ${activeProject.form.calculationMode === item.value ? "is-selected" : ""}`} onClick={() => updateForm({ calculationMode: item.value })}>
          <strong>{item.label}</strong>
        </button>
      ))}
    </div>
  );
}

function LoadProfileEditor() {
  const { activeProject, updateForm, updateLoadProfileValue, resetLoadProfile } = useProjectStore();
  const profile = activeProject.form.loadProfile || [];

  const hourlyEnergy = useMemo(() => {
    const totalKwh = Number(activeProject.form.dailyEnergyKwh) || 0;
    const totalWh = totalKwh * 1000;
    const totalFactor = profile.reduce((sum, slot) => sum + (Number(slot.factor) || 0), 0);
    return profile.map((slot) => ({
      ...slot,
      energyWh: totalFactor > 0 ? ((Number(slot.factor) || 0) / totalFactor) * totalWh : 0,
    }));
  }, [activeProject.form.dailyEnergyKwh, profile]);

  return (
    <div className="stack-lg">
      <div className="profile-summary-grid">
        <Field label="انرژی روزانه (kWh/day)" hint="پروفایل ساعتی بر اساس این انرژی نرمال می‌شود.">
          <input type="text" inputMode="decimal" value={activeProject.form.dailyEnergyKwh} onChange={(e) => updateForm({ dailyEnergyKwh: e.target.value })} />
        </Field>
        <Field label="Peak Factor" hint="برای بررسی پیک طراحی در کنار پروفایل">
          <input type="text" inputMode="decimal" step="0.1" value={activeProject.form.peakFactor} onChange={(e) => updateForm({ peakFactor: e.target.value })} />
        </Field>
      </div>

      <div className="profile-toolbar">
        <div>
          <strong>ویرایش‌گر پروفایل ساعتی</strong>
          <p>برای هر ساعت ضریب نسبی مصرف را وارد کن. جمع خودکار نرمال می‌شود.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={resetLoadProfile}>بازنشانی الگوی پیش‌فرض</button>
      </div>

      <div className="profile-grid">
        {hourlyEnergy.map((slot) => (
          <div key={slot.id} className="profile-card">
            <span className="profile-card__hour">{slot.label}</span>
            <input
              type="text" inputMode="decimal"
              min="0"
              step="0.05"
              value={slot.factor}
              onChange={(e) => updateLoadProfileValue(slot.id, e.target.value)}
            />
            <strong>{Math.round(slot.energyWh)} Wh</strong>
          </div>
        ))}
      </div>
    </div>
  );
}


function SmartPresetPicker() {
  const { activeProject, updateForm } = useProjectStore();
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);
  const form = activeProject.form;

  const presets = useMemo(() => {
    const base = getSmartPresetsForSystem(form.systemType);
    const q = filter.trim();
    if (!q) return base;
    return base.filter((preset) => {
      const haystack = `${preset.title} ${preset.category} ${preset.bestFor} ${preset.summary} ${(preset.tags || []).join(" ")}`;
      return haystack.includes(q);
    });
  }, [filter, form.systemType]);

  const visiblePresets = expanded ? presets : presets.slice(0, 4);

  function applyPreset(preset) {
    const normalizedItems = (preset.patch.loadItems || []).map((item) => ({
      id: crypto.randomUUID(),
      qty: 1,
      hours: 1,
      powerFactor: 0.95,
      coincidenceFactor: 1,
      loadType: "mixed",
      surgeFactor: 1,
      ...item,
    }));

    const patch = {
      ...preset.patch,
      projectTitle: form.projectTitle && form.projectTitle !== "پروژه جدید Solar Design Suite" ? form.projectTitle : preset.patch.projectTitle,
    };

    if (preset.patch.loadItems) patch.loadItems = normalizedItems;

    updateForm(patch);
    window.alert(`سناریوی آماده «${preset.title}» روی فرم اعمال شد. می‌توانید مقادیر را قبل از محاسبه ویرایش کنید.`);
  }

  return (
    <section className="panel panel--soft smart-library-panel">
      <div className="panel__header">
        <div>
          <h3>کتابخانه هوشمند سناریوهای آماده</h3>
          <p className="section-note">اگر مصرف مشتری شبیه یکی از موارد زیر است، انتخاب کنید تا اطلاعات فرم سریع تکمیل شود.</p>
        </div>
        <span className="badge">{presets.length} سناریو</span>
      </div>

      <input
        className="search-input"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="جستجو بین سناریوها: ویلا، پمپ، مغازه، دفتر، آفگرید..."
      />

      <div className="smart-preset-grid">
        {visiblePresets.map((preset) => (
          <article key={preset.id} className="smart-preset-card">
            <div className="smart-preset-card__head">
              <strong>{preset.title}</strong>
              <span>{preset.category}</span>
            </div>
            <p>{preset.bestFor}</p>
            <div className="smart-preset-tags">
              {(preset.tags || []).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <button className="btn btn--primary btn--sm" type="button" onClick={() => applyPreset(preset)}>
              اعمال روی فرم
            </button>
          </article>
        ))}
      </div>

      {presets.length > 4 ? (
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? "نمایش کمتر" : "نمایش همه سناریوها"}
        </button>
      ) : null}
    </section>
  );
}



function LoadEquipmentQuickAdd({ onAdd }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => EquipmentRepository.search({ category: "load", query }), [query]);
  const visible = options.slice(0, 8);

  function addItem(item) {
    if (!item) return;
    onAdd({ ...(item.specs || {}), name: item.specs?.name || item.title });
    setQuery("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem(visible[0]);
    }
  }

  return (
    <section className="panel panel--soft load-search-panel">
      <div className="panel__header compact">
        <div>
          <h3>افزودن مصرف‌کننده از کتابخانه</h3>
          <p className="section-note">نام تجهیز را سرچ کن و Enter بزن؛ اولین مورد لیست مستقیم به بارها اضافه می‌شود.</p>
        </div>
        <span className="badge">{EquipmentRepository.list("load").length} مصرف‌کننده آماده</span>
      </div>
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="مثلاً یخچال، پمپ، کولر، لامپ، مودم..."
      />
      <div className="quick-load-list">
        {visible.map((item) => (
          <button key={item.id} type="button" className="quick-load-item" onClick={() => addItem(item)}>
            <strong>{item.title}</strong>
            <span>{item.summary}</span>
            <small>{item.specs?.power ?? "—"}W × {item.specs?.qty ?? 1} | {item.specs?.hours ?? "—"}h | همزمانی {item.specs?.coincidenceFactor ?? 1}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function StepLoads() {
  const { activeProject, updateForm, updateLoadItem, addLoadItem, removeLoadItem } = useProjectStore();
  const form = activeProject.form;

  const loadSummary = useMemo(() => {
    const items = form.loadItems || [];
    const connectedPowerW = items.reduce((sum, item) => sum + (parseFaNumber(item.qty, 1) * parseFaNumber(item.power, 0)), 0);
    const realRunPowerW = items.reduce((sum, item) => sum + (parseFaNumber(item.qty, 1) * parseFaNumber(item.power, 0) * parseFaNumber(item.coincidenceFactor, 1)), 0);
    const dailyEnergyWh = items.reduce((sum, item) => sum + (parseFaNumber(item.qty, 1) * parseFaNumber(item.power, 0) * parseFaNumber(item.hours, 0) * parseFaNumber(item.coincidenceFactor, 1)), 0);
    const connectedApparentVA = items.reduce((sum, item) => {
      const pf = Math.max(parseFaNumber(item.powerFactor, 0.95), 0.1);
      return sum + ((parseFaNumber(item.qty, 1) * parseFaNumber(item.power, 0)) / pf);
    }, 0);
    const surgePowerW = items.reduce((sum, item) => sum + (parseFaNumber(item.qty, 1) * parseFaNumber(item.power, 0) * parseFaNumber(item.surgeFactor, 1) * parseFaNumber(item.coincidenceFactor, 1)), 0);
    return { connectedPowerW, realRunPowerW, dailyEnergyWh, connectedApparentVA, surgePowerW, averageCoincidence: connectedPowerW > 0 ? realRunPowerW / connectedPowerW : 1, averagePowerFactor: connectedApparentVA > 0 ? connectedPowerW / connectedApparentVA : 0.95 };
  }, [form.loadItems]);

  if (form.calculationMode === "loads") {
    return (
      <div className="stack-lg">
        <SmartPresetPicker />
        <LoadEquipmentQuickAdd onAdd={addLoadItem} />
        <div className="load-factor-grid">
          <div className="metric-card metric-card--blue">
            <div className="metric-card__label">مجموع توان نصب‌شده تجهیزات</div>
            <div className="metric-card__value">{loadSummary.connectedPowerW.toFixed(0)} W</div>
          </div>
          <div className="metric-card metric-card--purple">
            <div className="metric-card__label">ضریب همزمانی میانگین</div>
            <div className="metric-card__value">{(loadSummary.averageCoincidence * 100).toFixed(0)}%</div>
          </div>
          <div className="metric-card metric-card--green">
            <div className="metric-card__label">نیاز واقعی اجرا</div>
            <div className="metric-card__value">{loadSummary.realRunPowerW.toFixed(0)} W</div>
          </div>
          <div className="metric-card metric-card--amber">
            <div className="metric-card__label">انرژی روزانه واقعی</div>
            <div className="metric-card__value">{loadSummary.dailyEnergyWh.toFixed(0)} Wh</div>
          </div>
          <div className="metric-card metric-card--blue">
            <div className="metric-card__label">ضریب توان میانگین</div>
            <div className="metric-card__value">{(loadSummary.averagePowerFactor * 100).toFixed(0)}%</div>
          </div>
          <div className="metric-card metric-card--purple">
            <div className="metric-card__label">توان راه‌اندازی تخمینی</div>
            <div className="metric-card__value">{loadSummary.surgePowerW.toFixed(0)} W</div>
          </div>
        </div>
        <div className="table-like">
          {form.loadItems.map((item) => (
            <div key={item.id} className="load-card-grid load-card-grid--labeled">
              <label><span>نام تجهیز</span><input value={item.name} onChange={(e) => updateLoadItem(item.id, { name: e.target.value })} placeholder="نام بار" /></label>
              <label><span>تعداد</span><input type="text" inputMode="decimal" value={item.qty} onChange={(e) => updateLoadItem(item.id, { qty: e.target.value })} placeholder="تعداد" /></label>
              <label><span>توان هر عدد (W)</span><input type="text" inputMode="decimal" value={item.power} onChange={(e) => updateLoadItem(item.id, { power: e.target.value })} placeholder="توان" /></label>
              <label><span>ساعت کار روزانه</span><input type="text" inputMode="decimal" value={item.hours} onChange={(e) => updateLoadItem(item.id, { hours: e.target.value })} placeholder="ساعت کار" /></label>
              <label><span>ضریب توان PF</span><input type="text" inputMode="decimal" value={item.powerFactor ?? 0.95} onChange={(e) => updateLoadItem(item.id, { powerFactor: e.target.value })} placeholder="PF" /></label>
              <label><span>ضریب همزمانی</span><input type="text" inputMode="decimal" value={item.coincidenceFactor ?? 1} onChange={(e) => updateLoadItem(item.id, { coincidenceFactor: e.target.value })} placeholder="ضریب همزمانی" /></label>
              <label><span>نوع بار</span><select value={item.loadType ?? "mixed"} onChange={(e) => updateLoadItem(item.id, { loadType: e.target.value })}>
                {LOAD_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select></label>
              <label><span>ضریب راه‌اندازی</span><input type="text" inputMode="decimal" value={item.surgeFactor ?? 1} onChange={(e) => updateLoadItem(item.id, { surgeFactor: e.target.value })} placeholder="ضریب راه‌اندازی" /></label>
              <button type="button" className="btn btn--ghost" onClick={() => removeLoadItem(item.id)}>حذف</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--secondary" onClick={() => addLoadItem()}>افزودن بار دستی</button>
      </div>
    );
  }

  if (form.calculationMode === "load_profile") {
    return (
      <div className="stack-lg">
        <SmartPresetPicker />
        <LoadProfileEditor />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <SmartPresetPicker />
      <div className="form-grid two-cols">
        {form.calculationMode === "current" ? (
          <Field label="جریان کل (A)"><input type="text" inputMode="decimal" value={form.current} onChange={(e) => updateForm({ current: e.target.value })} /></Field>
        ) : null}
        {form.calculationMode === "power" ? (
          <Field label="توان کل (W)"><input type="text" inputMode="decimal" value={form.loadPower} onChange={(e) => updateForm({ loadPower: e.target.value })} /></Field>
        ) : null}
        {form.calculationMode === "daily_energy" ? (
          <Field label="انرژی روزانه (kWh/day)"><input type="text" inputMode="decimal" value={form.dailyEnergyKwh} onChange={(e) => updateForm({ dailyEnergyKwh: e.target.value })} /></Field>
        ) : null}
        <Field label="ولتاژ بار (V)"><input type="text" inputMode="decimal" value={form.loadVoltage} onChange={(e) => updateForm({ loadVoltage: e.target.value })} /></Field>
        <Field label="ضریب توان PF"><input type="text" inputMode="decimal" value={form.powerFactor} onChange={(e) => updateForm({ powerFactor: e.target.value })} /></Field>
        <Field label={form.systemType === "backup" ? "ساعت برق اضطراری موردنیاز مشتری" : "زمان بکاپ / مرجع (h)"}><input type="text" inputMode="decimal" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} /></Field>
        {form.calculationMode === "daily_energy" ? (
          <Field label="Peak Factor"><input type="text" inputMode="decimal" value={form.peakFactor} onChange={(e) => updateForm({ peakFactor: e.target.value })} /></Field>
        ) : null}
      </div>
    </div>
  );

}

function StepSite() {
  const { activeProject, updateForm } = useProjectStore();
  const form = activeProject.form;

  if (form.systemType === "backup") {
    return (
      <div className="panel panel--soft backup-note-card">
        <div className="panel__header"><h3>مسیر سانورتر و باطری</h3></div>
        <p>در این حالت، پارامترهای خورشیدی مانند ساعات تابش، زاویه نصب، سایه و گردوغبار در محاسبات وارد نمی‌شوند. تمرکز طراحی فقط روی بار، سانورتر، باطری، کابل و حفاظت است.</p>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <ClimateInfoCard form={form} />
      <div className="form-grid two-cols">
        <Field label="ساعات تابش موثر شهر (PSH)">
          <input type="text" inputMode="decimal" value={form.sunHours} onChange={(e) => updateForm({ sunHours: e.target.value })} />
        </Field>
        <Field label="دمای متوسط شهر (°C)">
          <input type="text" inputMode="decimal" value={form.averageTemperature} onChange={(e) => updateForm({ averageTemperature: e.target.value })} />
        </Field>
        <Field label="حداقل دما برای Voc سرد (°C)">
          <input type="text" inputMode="decimal" value={form.minTemperature} onChange={(e) => updateForm({ minTemperature: e.target.value })} />
        </Field>
        <Field label="حداکثر دما برای افت توان پنل (°C)">
          <input type="text" inputMode="decimal" value={form.maxTemperature} onChange={(e) => updateForm({ maxTemperature: e.target.value })} />
        </Field>
        <Field label="ارتفاع از سطح دریا (m)">
          <input type="text" inputMode="decimal" value={form.altitude} onChange={(e) => updateForm({ altitude: e.target.value })} />
        </Field>
        <Field label="ضریب سایه">
          <input type="text" inputMode="decimal" step="0.01" value={form.shadingFactor} onChange={(e) => updateForm({ shadingFactor: e.target.value })} />
        </Field>
        <Field label="ضریب گردوغبار">
          <input type="text" inputMode="decimal" step="0.01" value={form.dustFactor} onChange={(e) => updateForm({ dustFactor: e.target.value })} />
        </Field>
        <Field label="زاویه نصب">
          <input type="text" inputMode="decimal" value={form.tiltAngle} onChange={(e) => updateForm({ tiltAngle: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}


function estimateUpsRuntime(form) {
  const num = (value, fallback = 0) => {
    const parsed = parseFaNumber(value, fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  let connectedPowerW = 0;
  let demandPowerW = 0;
  let surgePowerW = 0;

  if (form.calculationMode === "loads" && Array.isArray(form.loadItems) && form.loadItems.length) {
    form.loadItems.forEach((item) => {
      const qty = num(item.qty, 1);
      const power = num(item.power, 0);
      const pf = Math.max(num(item.powerFactor, 1), 0.1);
      const coincidence = num(item.coincidenceFactor, 1);
      const surge = num(item.surgeFactor, form.surgeFactor || 1);
      const activePowerW = qty * power;
      connectedPowerW += activePowerW;
      demandPowerW += activePowerW * coincidence;
      surgePowerW += activePowerW * surge * coincidence;
    });
  } else if (form.calculationMode === "current") {
    demandPowerW = num(form.current) * num(form.loadVoltage, 220) * num(form.powerFactor, 0.95);
    connectedPowerW = demandPowerW;
    surgePowerW = demandPowerW * num(form.surgeFactor, 1.5);
  } else if (form.calculationMode === "daily_energy" || form.calculationMode === "load_profile") {
    const energyWh = num(form.dailyEnergyKwh) * 1000;
    demandPowerW = Math.max(energyWh / Math.max(num(form.backupHours, 1), 1), energyWh / 24);
    connectedPowerW = demandPowerW;
    surgePowerW = demandPowerW * num(form.peakFactor, 2);
  } else {
    demandPowerW = num(form.loadPower);
    connectedPowerW = demandPowerW;
    surgePowerW = demandPowerW * num(form.surgeFactor, 1.5);
  }

  demandPowerW = Math.max(demandPowerW, 1);
  const systemVoltage = num(form.systemVoltage, 48);
  const batteryUnitVoltage = num(form.batteryUnitVoltage, 12);
  const batteryUnitAh = num(form.batteryUnitAh, 100);
  const dod = Math.min(Math.max(num(form.dod, 0.8), 0.1), 1);
  const inverterEfficiency = Math.min(Math.max(num(form.inverterEfficiency, 0.9), 0.1), 1);
  const batteryEfficiency = Math.min(Math.max(num(form.batteryRoundTripEfficiency, 0.9), 0.1), 1);

  const seriesCount = Math.max(1, Math.ceil(systemVoltage / Math.max(batteryUnitVoltage, 1)));
  const requiredAhForDesired = (demandPowerW * num(form.backupHours, 1)) / (systemVoltage * inverterEfficiency * dod * batteryEfficiency);
  const parallelCount = Math.max(1, Math.ceil(requiredAhForDesired / Math.max(batteryUnitAh, 1)));
  const totalCount = seriesCount * parallelCount;

  const bankAh = parallelCount * batteryUnitAh;
  const usableEnergyWh = bankAh * systemVoltage * dod * inverterEfficiency * batteryEfficiency;
  const realBackupHours = usableEnergyWh / demandPowerW;

  return {
    connectedPowerW,
    demandPowerW,
    surgePowerW,
    desiredBackupHours: num(form.backupHours, 1),
    seriesCount,
    parallelCount,
    totalCount,
    bankAh,
    usableEnergyWh,
    realBackupHours,
  };
}

function UpsRuntimePreview() {
  const { activeProject, updateForm } = useProjectStore();
  const form = activeProject.form;
  const estimate = useMemo(() => estimateUpsRuntime(form), [form]);

  if (form.systemType !== "backup") return null;

  const statusClass = estimate.realBackupHours + 0.05 >= estimate.desiredBackupHours ? "ups-runtime-card--ok" : "ups-runtime-card--warn";
  const statusText = estimate.realBackupHours + 0.05 >= estimate.desiredBackupHours
    ? "زمان برق اضطراری این ترکیب کافی است"
    : "زمان برق اضطراری کمتر از نیاز مشتری است";

  return (
    <section className={`panel panel--soft ups-runtime-card ${statusClass}`}>
      <div className="panel__header">
        <div>
          <h3>محاسبه برق اضطراری سانورتر و باطری</h3>
          <p className="section-note">اول ساعت موردنیاز مشتری را وارد کنید؛ سپس با تغییر سانورتر، ولتاژ و ظرفیت باطری، زمان واقعی برق اضطراری به‌صورت زنده نمایش داده می‌شود.</p>
        </div>
        <span className="badge">{statusText}</span>
      </div>

      <div className="form-grid two-cols">
        <Field label="ساعت برق اضطراری موردنیاز مشتری">
          <input type="text" inputMode="decimal" step="0.5" min="0.5" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} />
        </Field>
        <Field label="توان بار محاسبه‌شده">
          <input readOnly value={`${estimate.demandPowerW.toFixed(0)} W`} />
        </Field>
      </div>

      <div className="metric-grid metric-grid--tight">
        <div className="metric-card">
          <div className="metric-card__label">برق اضطراری واقعی</div>
          <div className="metric-card__value">{estimate.realBackupHours.toFixed(1)} h</div>
        </div>
        <div className="metric-card metric-card--purple">
          <div className="metric-card__label">آرایش باطری</div>
          <div className="metric-card__value">{estimate.seriesCount}S × {estimate.parallelCount}P</div>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-card__label">تعداد کل باطری</div>
          <div className="metric-card__value">{estimate.totalCount}</div>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-card__label">انرژی قابل استفاده</div>
          <div className="metric-card__value">{(estimate.usableEnergyWh / 1000).toFixed(1)} kWh</div>
        </div>
      </div>

      <div className="summary-list ups-runtime-summary">
        <div><span>نیاز مشتری</span><strong>{estimate.desiredBackupHours.toFixed(1)} ساعت</strong></div>
        <div><span>ظرفیت بانک</span><strong>{estimate.bankAh.toFixed(0)}Ah @ {form.systemVoltage}V</strong></div>
        <div><span>توان پیک تقریبی</span><strong>{estimate.surgePowerW.toFixed(0)} W</strong></div>
      </div>
    </section>
  );
}


function EquipmentSelector({ category, label, selectedId, onSelect, disabled = false, systemType = null }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const found = EquipmentRepository.search({ category, query });
    if (category !== "inverter") return found;
    if (systemType === "hybrid") return found.filter((item) => item.specs?.inverterMode === "hybrid");
    if (systemType === "offgrid" || systemType === "backup") return found.filter((item) => item.specs?.inverterMode === "offgrid");
    return found;
  }, [category, query, systemType]);
  const selectedItem = selectedId ? EquipmentRepository.getById(selectedId) : null;

  return (
    <div className="equipment-selector">
      <div className="equipment-selector__header">
        <strong>{label}</strong>
        {selectedItem ? <span>{selectedItem.title}</span> : <span>هنوز تجهیزی انتخاب نشده است</span>}
      </div>
      <input
        className="search-input"
        value={query}
        disabled={disabled}
        placeholder={`جستجو در ${label}...`}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="equipment-choice-list">
        <button type="button" className={`equipment-choice ${!selectedId ? "is-active" : ""}`} onClick={() => onSelect(null)} disabled={disabled}>
          ورود دستی / بدون انتخاب
        </button>
        {options.slice(0, 6).map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            className={`equipment-choice ${selectedId === item.id ? "is-active" : ""}`}
            onClick={() => onSelect(item)}
          >
            <strong>{item.title}</strong>
            <span>{item.brand} / {item.model}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSystemConfig() {
  const { activeProject, updateForm, openEquipmentLibrary } = useProjectStore();
  const form = activeProject.form;
  const availableSystemVoltages = form.systemType === "backup" ? BACKUP_SYSTEM_VOLTAGES : SYSTEM_VOLTAGES;
  const availableBatteryVoltages = form.systemType === "backup"
    ? BATTERY_UNIT_VOLTAGE_OPTIONS.filter((voltage) => voltage <= Number(form.systemVoltage) && Number(form.systemVoltage) % voltage === 0)
    : BATTERY_UNIT_VOLTAGE_OPTIONS;

  function applyEquipment(role, item) {
    if (!item) {
      updateForm({
        selectedEquipment: {
          ...(form.selectedEquipment || {}),
          [role]: null,
        },
      });
      return;
    }

    updateForm({
      selectedEquipment: {
        ...(form.selectedEquipment || {}),
        [role]: item.id,
      },
      ...item.specs,
    });
  }

  return (
    <div className="stack-lg">
      <section className="panel panel--soft">
        <div className="panel__header">
          <h3>انتخاب از بانک تجهیزات</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEquipmentLibrary("workspace")}>باز کردن کتابخانه</button>
        </div>
        <div className="equipment-selector-grid">
          {form.systemType !== "backup" ? (
            <EquipmentSelector
              category="panel"
              label="پنل خورشیدی"
              selectedId={form.selectedEquipment?.panel}
              onSelect={(item) => applyEquipment("panel", item)}
            />
          ) : null}
          <EquipmentSelector
            category="battery"
            label="باتری"
            selectedId={form.selectedEquipment?.battery}
            onSelect={(item) => applyEquipment("battery", item)}
          />
          <EquipmentSelector
            category="inverter"
            label={form.systemType === "backup" ? "سانورتر" : "اینورتر"}
            selectedId={form.selectedEquipment?.inverter}
            systemType={form.systemType}
            onSelect={(item) => applyEquipment("inverter", item)}
          />
        </div>
      </section>

      <UpsRuntimePreview />

      <div className="form-grid two-cols">
        <Field label="ولتاژ سیستم">
        <select value={form.systemVoltage} onChange={(e) => updateForm({ systemVoltage: e.target.value })}>{availableSystemVoltages.map((v) => <option key={v} value={v}>{v}V</option>)}</select>
      </Field>
      <Field label="نوع باتری">
        <select value={form.batteryType} onChange={(e) => updateForm({ batteryType: e.target.value })}>{BATTERY_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
      </Field>
      {form.systemType === "hybrid" ? (
        <Field label="استراتژی هیبرید">
          <select value={form.hybridMode} onChange={(e) => updateForm({ hybridMode: e.target.value })}>{HYBRID_MODES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
        </Field>
      ) : null}
      {form.systemType === "gridtie" ? (
        <Field label="هدف جبران انرژی (%)"><input type="text" inputMode="decimal" value={form.targetOffsetPercent} onChange={(e) => updateForm({ targetOffsetPercent: e.target.value })} /></Field>
      ) : null}
      <Field label="ظرفیت واحد باتری (Ah)">{form.systemType === "backup" ? (
        <select value={form.batteryUnitAh} onChange={(e) => updateForm({ batteryUnitAh: e.target.value })}>{BACKUP_BATTERY_CAPACITY_OPTIONS.map((v) => <option key={v} value={v}>{v}Ah</option>)}</select>
      ) : (
        <input type="text" inputMode="decimal" value={form.batteryUnitAh} onChange={(e) => updateForm({ batteryUnitAh: e.target.value })} />
      )}</Field>
      <Field label="ولتاژ واحد باتری (V)">{form.systemType === "backup" ? (
        <select value={form.batteryUnitVoltage} onChange={(e) => updateForm({ batteryUnitVoltage: e.target.value })}>{availableBatteryVoltages.map((v) => <option key={v} value={v}>{v}V</option>)}</select>
      ) : (
        <input type="text" inputMode="decimal" value={form.batteryUnitVoltage} onChange={(e) => updateForm({ batteryUnitVoltage: e.target.value })} />
      )}</Field>
      <Field label="روزهای خودمختاری"><input type="text" inputMode="decimal" step="0.1" value={form.daysAutonomy} onChange={(e) => updateForm({ daysAutonomy: e.target.value })} /></Field>
      <Field label="عمق دشارژ DoD"><input type="text" inputMode="decimal" step="0.01" value={form.dod} onChange={(e) => updateForm({ dod: e.target.value })} /></Field>
      <Field label="راندمان اینورتر"><input type="text" inputMode="decimal" step="0.01" value={form.inverterEfficiency} onChange={(e) => updateForm({ inverterEfficiency: e.target.value })} /></Field>
      {form.systemType !== "backup" ? <Field label="راندمان MPPT داخلی"><input type="text" inputMode="decimal" step="0.01" value={form.controllerEfficiency} onChange={(e) => updateForm({ controllerEfficiency: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="توان پنل (W)"><input type="text" inputMode="decimal" value={form.panelWatt} onChange={(e) => updateForm({ panelWatt: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="Voc پنل"><input type="text" inputMode="decimal" step="0.1" value={form.panelVoc} onChange={(e) => updateForm({ panelVoc: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="Vmp پنل"><input type="text" inputMode="decimal" step="0.1" value={form.panelVmp} onChange={(e) => updateForm({ panelVmp: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداکثر Voc ورودی MPPT"><input type="text" inputMode="decimal" value={form.controllerMaxVoc} onChange={(e) => updateForm({ controllerMaxVoc: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداقل MPPT"><input type="text" inputMode="decimal" value={form.mpptMinVoltage} onChange={(e) => updateForm({ mpptMinVoltage: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداکثر MPPT"><input type="text" inputMode="decimal" value={form.mpptMaxVoltage} onChange={(e) => updateForm({ mpptMaxVoltage: e.target.value })} /></Field> : null}
      <Field label="ضریب طراحی"><input type="text" inputMode="decimal" step="0.01" value={form.designFactor} onChange={(e) => updateForm({ designFactor: e.target.value })} /></Field>
        <Field label="ضریب Surge پیش‌فرض"><input type="text" inputMode="decimal" step="0.1" value={form.surgeFactor} onChange={(e) => updateForm({ surgeFactor: e.target.value })} /></Field>
      </div>
    </div>
  );
}

function StepReview() {
  const { activeProject } = useProjectStore();
  const form = activeProject.form;
  const profilePeak = Math.max(...(form.loadProfile || []).map((slot) => Number(slot.factor) || 0), 0);
  return (
    <div className="summary-list">
      <div><span>پروژه</span><strong>{form.projectTitle}</strong></div>
      <div><span>نوع سیستم</span><strong>{SYSTEM_TYPES.find((item) => item.value === form.systemType)?.label || form.systemType}</strong></div>
      <div><span>روش محاسبه</span><strong>{form.calculationMode}</strong></div>
      {form.systemType !== "backup" ? <div><span>شهر / تابش</span><strong>{form.city} / {form.sunHours} h</strong></div> : <div><span>حالت طراحی</span><strong>سانورتر و باطری بدون پنل</strong></div>}
      <div><span>ولتاژ سیستم</span><strong>{form.systemVoltage} V</strong></div>
      <div><span>نوع باتری</span><strong>{form.batteryType}</strong></div>
      <div><span>تجهیزات انتخاب‌شده</span><strong>{[form.systemType !== "backup" ? form.selectedEquipment?.panel : null, form.selectedEquipment?.battery, form.selectedEquipment?.inverter, null].filter(Boolean).length} مورد</strong></div>
      {form.calculationMode === "load_profile" ? <div><span>بیشترین ضریب ساعتی</span><strong>{profilePeak.toFixed(2)}</strong></div> : null}
      {form.calculationMode === "load_profile" ? <div><span>انرژی روزانه هدف</span><strong>{form.dailyEnergyKwh} kWh/day</strong></div> : null}
    </div>
  );
}

const stepMap = [
  { title: "اطلاعات پروژه", component: StepProjectInfo },
  { title: "نوع سیستم", component: StepSystemType },
  { title: "روش محاسبه", component: StepCalculationMode },
  { title: "مدل بار", component: StepLoads },
  { title: "شرایط محیطی", component: StepSite },
  { title: "تنظیمات سیستم", component: StepSystemConfig },
  { title: "مرور و اجرای محاسبه", component: StepReview },
];

export function ProjectWorkspacePage() {
  const { stepIndex, nextStep, prevStep, runCalculation, saveProject, goDashboard, openScenarios } = useProjectStore();
  const CurrentStep = stepMap[stepIndex].component;

  return (
    <div className="shell">
      <header className="topbar topbar--workspace" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.92), rgba(15,23,42,0.82)), url(${PUBLIC_ASSETS.backgrounds.workspace})` }}>
        <div className="topbar__actions"><button className="btn btn--ghost" onClick={goDashboard}>بازگشت به داشبورد</button><button className="btn btn--secondary" type="button" onClick={() => openScenarios("workspace")}>سناریوهای آماده</button></div>
        <div className="topbar__title topbar__title--brand"><img src={PUBLIC_ASSETS.branding.appLogo} alt="SDS" className="topbar__brand-logo" /> <span>Solar Design Suite / Workspace</span></div>
      </header>
      <WizardShell
        title={stepMap[stepIndex].title}
        actions={(
          <>
            <button type="button" className="btn btn--ghost" onClick={prevStep}>مرحله قبل</button>
            <button type="button" className="btn btn--secondary" onClick={saveProject}>ذخیره پیش‌نویس</button>
            {stepIndex === stepMap.length - 1 ? (
              <button type="button" className="btn btn--primary" onClick={runCalculation}>اجرای محاسبات</button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={nextStep}>مرحله بعد</button>
            )}
          </>
        )}
      >
        <CurrentStep />
      </WizardShell>
    </div>
  );
}
