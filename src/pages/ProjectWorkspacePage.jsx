import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
import { WizardShell } from "../features/project-wizard/components/WizardShell";
import {
  SYSTEM_GROUPS,
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
  const form = activeProject.form;
  const selectedGroup = form.systemType === "backup" ? "backup" : "solar";
  const solarTypes = SYSTEM_TYPES.filter((item) => item.group === "solar");
  return (
    <div className="stack-lg">
      <div className="card-grid">
        {SYSTEM_GROUPS.map((item) => (
          <button key={item.value} type="button" className={`choice-card ${selectedGroup === item.value ? "is-selected" : ""}`} onClick={() => updateForm(item.value === "backup" ? { systemType: "backup", backupHours: form.backupHours ?? 0, daysAutonomy: 0 } : { systemType: form.systemType === "backup" ? "offgrid" : form.systemType, daysAutonomy: form.daysAutonomy ?? 0, backupHours: 0 })}>
            <strong>{item.label}</strong><span>{item.description}</span>
          </button>
        ))}
      </div>
      {selectedGroup === "solar" ? (
        <section className="panel panel--soft">
          <div className="panel__header"><h3>زیرمجموعه سیستم پنل‌دار</h3><span className="badge">مرحله دوم انتخاب</span></div>
          <div className="card-grid">
            {solarTypes.map((item) => (
              <button key={item.value} type="button" className={`choice-card ${form.systemType === item.value ? "is-selected" : ""}`} onClick={() => updateForm({ systemType: item.value, backupHours: 0 })}>
                <strong>{item.label}</strong><span>{item.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel panel--soft"><p className="section-note">در مسیر بدون پنل، محاسبات بر اساس برق اضطراری موردنیاز انجام می‌شود و روزهای خودکفایی حذف می‌گردد.</p></section>
      )}
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
  const { activeProject, updateForm, goToStep } = useProjectStore();
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
      inverterSupply: "with_inverter",
      surgeFactor: 1,
      ...item,
    }));

    const patch = {
      ...preset.patch,
      projectTitle: form.projectTitle && form.projectTitle !== "پروژه جدید Solar Design Suite" ? form.projectTitle : preset.patch.projectTitle,
    };

    if (preset.patch.loadItems) patch.loadItems = normalizedItems;

    updateForm({ ...patch, daysAutonomy: patch.systemType === "backup" ? 0 : (patch.daysAutonomy ?? "0") });
    goToStep(5);
    window.alert(`سناریوی آماده «${preset.title}» اعمال شد. اکنون وارد بخش تجهیزات و تنظیمات می‌شوید تا اینورتر، باتری و پنل را بررسی یا اصلاح کنید.`);
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
            <small>{item.specs?.power ?? "—"}W × {item.specs?.qty ?? 1} | {item.specs?.hours ?? "—"}h | {item.specs?.dailyKwh ?? "—"} kWh/day | همزمانی {item.specs?.coincidenceFactor ?? 1}</small>
          </button>
        ))}
      </div>
    </section>
  );
}


function CalculationRouteNotice({ form }) {
  const isBackup = form.systemType === "backup";
  const routeTitle = isBackup ? "مسیر محاسبه: تأمین برق اضطراری با باتری" : "مسیر محاسبه: سیستم با پنل خورشیدی";
  const routeText = isBackup
    ? "در این مسیر پنل خورشیدی وارد محاسبات نمی‌شود و طراحی بر پایه سانورتر، باتری، کابل و حفاظت انجام می‌گردد."
    : "در این مسیر، پنل خورشیدی، باتری، سانورتر/اینورتر، MPPT و شرایط محیطی تا انتهای محاسبات و خروجی PDF لحاظ می‌شود.";
  return (
    <section className="panel panel--soft">
      <div className="panel__header"><h3>{routeTitle}</h3><span className="badge">فعال</span></div>
      <p className="section-note">{routeText}</p>
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
    const dailyEnergyWh = items.reduce((sum, item) => {
      const qty = parseFaNumber(item.qty, 1);
      const libraryDailyKwh = parseFaNumber(item.dailyKwh, 0);
      if (libraryDailyKwh > 0) return sum + (qty * libraryDailyKwh * 1000);
      return sum + (qty * parseFaNumber(item.power, 0) * parseFaNumber(item.hours, 0) * parseFaNumber(item.coincidenceFactor, 1));
    }, 0);
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
        <CalculationRouteNotice form={form} />
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
              <label><span>تغذیه بار</span><select value={item.inverterSupply ?? "with_inverter"} onChange={(e) => updateLoadItem(item.id, { inverterSupply: e.target.value })}>
                <option value="with_inverter">اینورتر دار</option>
                <option value="without_inverter">بدون اینورتر / DC مستقیم</option>
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
        <CalculationRouteNotice form={form} />
        <LoadProfileEditor />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <CalculationRouteNotice form={form} />
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
        {form.systemType === "backup" ? (
          <Field label="زمان برق اضطراری مورد نیاز (ساعت)"><input type="text" inputMode="decimal" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} /></Field>
        ) : null}
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
        <div className="panel__header"><h3>مسیر تامین برق اضطراری با باتری</h3></div>
        <p>در این حالت، پارامترهای خورشیدی مانند ساعات تابش، زاویه نصب، سایه و گردوغبار در محاسبات وارد نمی‌شوند. تمرکز طراحی فقط روی بار، سانورتر، باتری، کابل و حفاظت است.</p>
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



function getLoadDemandForRecommendation(form) {
  const num = (value, fallback = 0) => {
    const parsed = parseFaNumber(value, fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  if (form.calculationMode === "loads" && Array.isArray(form.loadItems) && form.loadItems.length) {
    const dailyEnergyWh = form.loadItems.reduce((sum, item) => {
      const qty = num(item.qty, 1);
      const libraryDailyKwh = num(item.dailyKwh, 0);
      if (libraryDailyKwh > 0) return sum + (qty * libraryDailyKwh * 1000);
      return sum + (qty * num(item.power, 0) * num(item.hours, 0) * num(item.coincidenceFactor, 1));
    }, 0);
    const demandPowerW = form.loadItems.reduce((sum, item) => sum + (num(item.qty, 1) * num(item.power, 0) * num(item.coincidenceFactor, 1)), 0);
    const surgePowerW = form.loadItems.reduce((sum, item) => sum + (num(item.qty, 1) * num(item.power, 0) * num(item.surgeFactor, form.surgeFactor || 1.5) * num(item.coincidenceFactor, 1)), 0);
    return { dailyEnergyWh, demandPowerW, surgePowerW };
  }

  if (form.calculationMode === "current") {
    const demandPowerW = num(form.current) * num(form.loadVoltage, 220) * num(form.powerFactor, 0.95);
    return { dailyEnergyWh: demandPowerW * num(form.backupHours, 1), demandPowerW, surgePowerW: demandPowerW * num(form.surgeFactor, 1.5) };
  }

  if (form.calculationMode === "daily_energy" || form.calculationMode === "load_profile") {
    const dailyEnergyWh = num(form.dailyEnergyKwh) * 1000;
    const demandPowerW = Math.max(dailyEnergyWh / Math.max(num(form.backupHours, 1), 1), dailyEnergyWh / 24);
    return { dailyEnergyWh, demandPowerW, surgePowerW: demandPowerW * num(form.peakFactor, 2) };
  }

  const demandPowerW = num(form.loadPower, 0);
  return { dailyEnergyWh: demandPowerW * num(form.backupHours, 1), demandPowerW, surgePowerW: demandPowerW * num(form.surgeFactor, 1.5) };
}

function pickSmartSolarEquipment(form, demand, preferredSystemVoltage) {
  const designFactor = Math.max(parseFaNumber(form.designFactor, 1.2) || 1.2, 1);
  const requiredContinuousW = Math.max(demand.demandPowerW * designFactor, 1);
  const requiredSurgeW = Math.max(demand.surgePowerW || requiredContinuousW, requiredContinuousW);
  const inverterMode = form.systemType === "hybrid" ? "hybrid" : "offgrid";
  const inverterOptions = EquipmentRepository.search({ category: "inverter", query: "" })
    .filter((item) => item.specs?.inverterMode === inverterMode || item.specs?.inverterMode === "offgrid")
    .sort((a, b) => getEquipmentNumber(a, "ratedPowerW") - getEquipmentNumber(b, "ratedPowerW"));
  const inverter = inverterOptions.find((item) => getEquipmentNumber(item, "ratedPowerW") >= requiredContinuousW && getEquipmentNumber(item, "surgePowerW") >= requiredSurgeW)
    || inverterOptions.find((item) => getEquipmentNumber(item, "systemVoltage") === preferredSystemVoltage)
    || inverterOptions.at(-1)
    || null;
  const systemVoltage = getEquipmentNumber(inverter, "systemVoltage", preferredSystemVoltage);

  const batteryOptions = EquipmentRepository.search({ category: "battery", query: "" })
    .filter((item) => normalizeBatteryType(item.specs?.batteryType) === "LFP")
    .map((item) => {
      const voltage = getEquipmentNumber(item, "batteryUnitVoltage", 0);
      const ah = getEquipmentNumber(item, "batteryUnitAh", 0);
      const issue = getBatteryVoltageIssue(systemVoltage, voltage);
      const series = isSameVoltageRange(systemVoltage, voltage) ? 1 : getSeriesCountForBattery(systemVoltage, voltage);
      const score = (issue ? 999999 : 0) + Math.abs((series * voltage) - systemVoltage) * 100 + (ah >= 100 ? 0 : 1000) - ah / 1000;
      return { item, voltage, ah, score };
    })
    .sort((a, b) => a.score - b.score);
  const battery = batteryOptions[0]?.item || null;

  const panelOptions = EquipmentRepository.search({ category: "panel", query: "" })
    .sort((a, b) => getEquipmentNumber(a, "panelWatt") - getEquipmentNumber(b, "panelWatt"));
  const panel = panelOptions.find((item) => getEquipmentNumber(item, "panelWatt", 0) >= 550) || panelOptions.at(-1) || null;
  return { inverter, battery, panel, systemVoltage };
}

function buildSmartSystemRecommendation(form) {
  const { dailyEnergyWh, demandPowerW, surgePowerW } = getLoadDemandForRecommendation(form);
  const dailyKwh = dailyEnergyWh / 1000;
  const peakKw = Math.max(demandPowerW, surgePowerW) / 1000;
  const isBackup = form.systemType === "backup";

  let systemVoltage = 12;
  if (peakKw > 1.2 || dailyKwh > 2) systemVoltage = 24;
  if (peakKw > 3 || dailyKwh > 5 || isBackup) systemVoltage = 48;
  if (!isBackup && (peakKw > 7 || dailyKwh > 14)) systemVoltage = 48;

  const smartEquipment = !isBackup ? pickSmartSolarEquipment(form, { dailyEnergyWh, demandPowerW, surgePowerW }, systemVoltage) : { inverter: null, battery: null, panel: null, systemVoltage };
  const inverter = smartEquipment.inverter;
  const battery = smartEquipment.battery;
  const panel = smartEquipment.panel;
  systemVoltage = smartEquipment.systemVoltage || systemVoltage;

  const batteryType = "LFP";
  const dod = 0.8;
  const inverterEfficiency = getEquipmentNumber(inverter, "inverterEfficiency", 0.95);
  const controllerEfficiency = 0.96;
  const daysAutonomy = isBackup ? 0 : Math.max(parseFaNumber(form.daysAutonomy, 0) || 0, 0);
  const batteryUnitVoltage = getEquipmentNumber(battery, "batteryUnitVoltage", systemVoltage >= 48 ? 51 : systemVoltage);
  const batteryUnitAh = getEquipmentNumber(battery, "batteryUnitAh", 100);
  const panelWatt = getEquipmentNumber(panel, "panelWatt", 550);
  const panelVoc = getEquipmentNumber(panel, "panelVoc", parseFaNumber(form.panelVoc, 53.1) || 53.1);
  const panelVmp = getEquipmentNumber(panel, "panelVmp", parseFaNumber(form.panelVmp, 44.8) || 44.8);
  const psh = Math.max(parseFaNumber(form.sunHours, 5.5), 3.5);
  const solarArrayW = Math.ceil((Math.max(dailyEnergyWh, demandPowerW * 4) * (parseFaNumber(form.panelFactor, 1) || 1)) / (psh * controllerEfficiency) / panelWatt) * panelWatt || panelWatt;

  return {
    patch: {
      selectedEquipment: {
        ...(form.selectedEquipment || {}),
        panel: form.selectedEquipment?.panel || panel?.id || null,
        battery: form.selectedEquipment?.battery || battery?.id || null,
        inverter: form.selectedEquipment?.inverter || inverter?.id || null,
      },
      systemVoltage: String(systemVoltage),
      batteryType,
      batteryUnitAh: String(batteryUnitAh),
      batteryFactor: form.batteryFactor || "1",
      batteryUnitVoltage: String(batteryUnitVoltage),
      daysAutonomy: String(daysAutonomy),
      backupParallelCount: "",
      dod: String(dod),
      inverterEfficiency: String(inverterEfficiency),
      controllerEfficiency: String(controllerEfficiency),
      designFactor: dailyKwh > 8 ? "1.25" : "1.2",
      surgeFactor: peakKw > 2 ? "2" : "1.7",
      panelWatt: String(panelWatt),
      panelVoc: String(panelVoc),
      panelVmp: String(panelVmp),
      panelTempCoeffVoc: String(getEquipmentNumber(panel, "panelTempCoeffVoc", parseFaNumber(form.panelTempCoeffVoc, 0.0024) || 0.0024)),
      controllerMaxVoc: systemVoltage >= 48 ? "500" : "150",
      mpptMinVoltage: systemVoltage >= 48 ? "120" : "60",
      mpptMaxVoltage: systemVoltage >= 48 ? "450" : "145",
      panelLossFactor: form.panelLossFactor || "0.9",
      panelFactor: form.panelFactor || "1",
      dcVoltageDropLimit: form.dcVoltageDropLimit || "3",
      batteryRoundTripEfficiency: "0.96",
      batteryVoltageDropLimit: form.batteryVoltageDropLimit || "2",
      acVoltageDropLimit: form.acVoltageDropLimit || "3",
      cableLossFactor: form.cableLossFactor || "0.97",
    },
    summary: {
      dailyKwh,
      demandPowerW,
      surgePowerW,
      solarArrayW,
      note: "پیشنهاد هوشمند تجهیزات از بانک بر اساس توان بار، Surge، انرژی روزانه، تابش شهر و محدوده MPPT انجام شده است.",
    },
  };
}


function getEquipmentNumber(item, key, fallback = 0) {
  const value = item?.specs?.[key];
  const parsed = parseFaNumber(value, fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSeriesCountForBattery(systemVoltage, batteryVoltage) {
  const safeSystemVoltage = Math.max(Number(systemVoltage) || 48, 1);
  const safeBatteryVoltage = Math.max(Number(batteryVoltage) || safeSystemVoltage, 1);
  return Math.max(1, Math.ceil(safeSystemVoltage / safeBatteryVoltage));
}

function normalizeBatteryType(value) {
  const raw = String(value || "LFP").toUpperCase();
  if (raw.includes("LFP") || raw.includes("LIFE") || raw.includes("LITHIUM")) return "LFP";
  if (raw.includes("NMC")) return "NMC";
  if (raw.includes("GEL")) return "GEL";
  if (raw.includes("AGM")) return "AGM";
  return raw || "LFP";
}

function getDefaultDodForBatteryType(value) {
  const type = normalizeBatteryType(value);
  if (type === "LFP") return 0.8;
  if (type === "NMC") return 0.75;
  return 0.5;
}

function isSameVoltageRange(systemVoltage, batteryVoltage) {
  const sv = Number(systemVoltage) || 0;
  const bv = Number(batteryVoltage) || 0;
  if (!sv || !bv) return false;
  // رنج‌های واقعی باتری لیتیومی: 24V با 24 تا 26V و 48V با 48 تا 52.5V هم‌خوان محسوب می‌شوند.
  if (sv >= 23 && sv <= 25 && bv >= 24 && bv <= 26.5) return true;
  if (bv >= 23 && bv <= 25 && sv >= 24 && sv <= 26.5) return true;
  if (sv >= 47 && sv <= 49 && bv >= 48 && bv <= 52.5) return true;
  if (bv >= 47 && bv <= 49 && sv >= 48 && sv <= 52.5) return true;
  return Math.abs(sv - bv) <= Math.max(2, sv * 0.09);
}

function isLowerSeriesCompatible(systemVoltage, batteryVoltage) {
  const sv = Number(systemVoltage) || 0;
  const bv = Number(batteryVoltage) || 0;
  if (!sv || !bv || bv >= sv) return false;
  const series = Math.round(sv / bv);
  return series >= 2 && Math.abs(series * bv - sv) <= Math.max(2, sv * 0.08);
}

function getBatteryVoltageIssue(systemVoltage, batteryVoltage) {
  const sv = Number(systemVoltage) || 0;
  const bv = Number(batteryVoltage) || 0;
  if (!sv || !bv) return null;
  if (isSameVoltageRange(sv, bv) || isLowerSeriesCompatible(sv, bv)) return null;
  if (bv > sv) return `ولتاژ باتری انتخابی (${bv}V) از ولتاژ سانورتر (${sv}V) بزرگ‌تر است. لطفاً باتری با ولتاژ کمتر/هم‌خوان انتخاب کنید یا سانورتر را مطابق رنج ${bv >= 48 ? "48V" : bv + "V"} تغییر دهید.`;
  return `ولتاژ باتری انتخابی (${bv}V) با ولتاژ سانورتر (${sv}V) همخوان نیست. لطفاً باتری یا سانورتر را از یک رنج سازگار انتخاب کنید.`;
}

function buildBackupEquipmentRecommendation(form) {
  const demand = getLoadDemandForRecommendation(form);
  const designFactor = Math.max(parseFaNumber(form.designFactor, 1.2) || 1.2, 1);
  const requiredContinuousW = Math.max(demand.demandPowerW * designFactor, 1);
  const requiredSurgeW = Math.max(demand.surgePowerW || 0, requiredContinuousW);
  const inverterOptions = EquipmentRepository.search({ category: "inverter", query: "" })
    .filter((item) => item.specs?.inverterMode === "offgrid")
    .sort((a, b) => getEquipmentNumber(a, "ratedPowerW") - getEquipmentNumber(b, "ratedPowerW"));
  const inverter = inverterOptions.find((item) => getEquipmentNumber(item, "ratedPowerW") >= requiredContinuousW && getEquipmentNumber(item, "surgePowerW") >= requiredSurgeW) || inverterOptions.at(-1) || null;
  const systemVoltage = getEquipmentNumber(inverter, "systemVoltage", parseFaNumber(form.systemVoltage, 48) || 48);
  const batteryOptions = EquipmentRepository.search({ category: "battery", query: "" })
    .filter((item) => getEquipmentNumber(item, "batteryUnitVoltage", 0) > 0 && getEquipmentNumber(item, "batteryUnitAh", 0) > 0);
  const desiredHours = Math.max(parseFaNumber(form.backupHours, 1) || 1, 0.1);
  const inverterEfficiency = getEquipmentNumber(inverter, "inverterEfficiency", parseFaNumber(form.inverterEfficiency, 0.93) || 0.93);
  const scoredBatteries = batteryOptions.map((item) => {
    const unitVoltage = getEquipmentNumber(item, "batteryUnitVoltage", systemVoltage);
    const unitAh = getEquipmentNumber(item, "batteryUnitAh", 100);
    const batteryType = normalizeBatteryType(item.specs?.batteryType || form.batteryType);
    const dod = getDefaultDodForBatteryType(batteryType);
    const roundTrip = getEquipmentNumber(item, "batteryRoundTripEfficiency", batteryType === "LFP" ? 0.96 : 0.9);
    const voltageIssue = getBatteryVoltageIssue(systemVoltage, unitVoltage);
    const sameRange = isSameVoltageRange(systemVoltage, unitVoltage);
    const seriesCount = sameRange ? 1 : getSeriesCountForBattery(systemVoltage, unitVoltage);
    const voltageDiff = sameRange ? 0 : Math.abs((seriesCount * unitVoltage) - systemVoltage);
    const requiredAh = (requiredContinuousW * desiredHours) / Math.max(systemVoltage * inverterEfficiency * dod * roundTrip, 1);
    const parallelCount = Math.max(1, Math.ceil(requiredAh / Math.max(unitAh, 1)));
    const voltagePenalty = voltageIssue ? 100000 : (sameRange ? 0 : 1000);
    return { item, seriesCount, parallelCount, totalCount: seriesCount * parallelCount, voltageDiff, unitVoltage, unitAh, dod, roundTrip, voltagePenalty, sameRange, batteryType };
  }).sort((a, b) => a.voltagePenalty - b.voltagePenalty || a.totalCount - b.totalCount || a.voltageDiff - b.voltageDiff || b.unitAh - a.unitAh);
  const batteryScore = scoredBatteries[0] || null;
  const battery = batteryScore?.item || null;
  const selectedInverter = form.selectedEquipment?.inverter ? EquipmentRepository.getById(form.selectedEquipment.inverter) : null;
  const selectedBattery = form.selectedEquipment?.battery ? EquipmentRepository.getById(form.selectedEquipment.battery) : null;
  const effectiveInverter = selectedInverter || inverter;
  const effectiveBattery = selectedBattery || battery;
  const effectiveSystemVoltage = getEquipmentNumber(effectiveInverter, "systemVoltage", systemVoltage);
  const patch = {
    systemVoltage: String(effectiveSystemVoltage),
    selectedEquipment: {
      ...(form.selectedEquipment || {}),
      inverter: form.selectedEquipment?.inverter || inverter?.id || null,
      battery: form.selectedEquipment?.battery || battery?.id || null,
    },
  };
  if (effectiveInverter?.specs) Object.assign(patch, {
    inverterEfficiency: String(effectiveInverter.specs.inverterEfficiency ?? form.inverterEfficiency),
    ratedPowerW: String(effectiveInverter.specs.ratedPowerW ?? form.ratedPowerW ?? ""),
    surgePowerW: String(effectiveInverter.specs.surgePowerW ?? form.surgePowerW ?? ""),
  });
  if (effectiveBattery?.specs) {
    const type = normalizeBatteryType(effectiveBattery.specs.batteryType ?? form.batteryType);
    Object.assign(patch, {
      batteryType: type,
      batteryUnitVoltage: String(effectiveBattery.specs.batteryUnitVoltage ?? form.batteryUnitVoltage),
      batteryUnitAh: String(effectiveBattery.specs.batteryUnitAh ?? form.batteryUnitAh),
      batteryRoundTripEfficiency: String(effectiveBattery.specs.batteryRoundTripEfficiency ?? (type === "LFP" ? 0.96 : form.batteryRoundTripEfficiency)),
      dod: String(getDefaultDodForBatteryType(type)),
      backupParallelCount: form.backupParallelCount || "",
    });
  }
  return { inverter: effectiveInverter, battery: effectiveBattery, batteryScore, requiredContinuousW, requiredSurgeW, patch };
}


function estimateSolarDesign(form) {
  const n = (value, fallback = 0) => {
    const parsed = parseFaNumber(value, fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const demand = getLoadDemandForRecommendation(form);
  const systemVoltage = n(form.systemVoltage, 48);
  const batteryVoltage = n(form.batteryUnitVoltage, systemVoltage);
  const batteryAh = n(form.batteryUnitAh, 100);
  const batteryFactor = Math.max(n(form.batteryFactor, 1), 1);
  const panelFactor = Math.max(n(form.panelFactor, 1), 1);
  const dod = Math.min(Math.max(n(form.dod, 0.8), 0.1), 1);
  const inverterEff = Math.min(Math.max(n(form.inverterEfficiency, 0.93), 0.1), 1);
  const batteryEff = Math.min(Math.max(n(form.batteryRoundTripEfficiency, 0.95), 0.1), 1);
  const daysAutonomy = Math.max(n(form.daysAutonomy, 0), 0);
  const backupHours = Math.max(n(form.backupHours, 0), 0);

  // انرژی روزانه مبنای خودکفایی باید برای همه روش‌های ورود اطلاعات معتبر باشد.
  // در بعضی روش‌ها مثل «بر اساس جریان کل» ممکن است dailyEnergyWh مستقیماً تولید نشود؛
  // بنابراین از انرژی روزانه واردشده، زمان بکاپ، یا حداقل ۴ ساعت کارکرد طراحی به عنوان پشتوانه استفاده می‌کنیم.
  const explicitDailyEnergyWh = n(form.dailyEnergyKwh, 0) * 1000;
  const backupDerivedWh = demand.demandPowerW * backupHours;
  const designDayFallbackWh = demand.demandPowerW * Math.max(backupHours, 4);
  const effectiveDailyEnergyWh = Math.max(demand.dailyEnergyWh, explicitDailyEnergyWh, backupDerivedWh, designDayFallbackWh, 0);

  const baseBackupWh = Math.max(effectiveDailyEnergyWh, backupDerivedWh);
  // روز خودکفایی یعنی تعداد روزی که باید انرژی مصرفی روزانه از باتری تأمین شود.
  // اگر صفر باشد، فقط ظرفیت پایه محاسبه می‌شود؛ اگر عدد وارد شود، همان عدد روز در ظرفیت باتری لحاظ می‌شود.
  const autonomyTargetWh = daysAutonomy > 0 ? effectiveDailyEnergyWh * daysAutonomy : 0;
  const autonomyExtraWh = daysAutonomy > 0 ? Math.max(autonomyTargetWh - baseBackupWh, 0) : 0;
  const targetWh = Math.max(baseBackupWh, autonomyTargetWh, backupDerivedWh);
  const requiredAh = targetWh > 0 ? (targetWh / Math.max(systemVoltage * dod * inverterEff * batteryEff, 1)) : 0;
  const batterySeries = isSameVoltageRange(systemVoltage, batteryVoltage) ? 1 : Math.max(1, Math.ceil(systemVoltage / Math.max(batteryVoltage, 1)));
  const batteryParallel = Math.max(1, Math.ceil((requiredAh / Math.max(batteryAh, 1)) * batteryFactor));
  const batteryTotal = batterySeries * batteryParallel;
  const bankAh = batteryParallel * batteryAh;

  const panelWatt = Math.max(n(form.panelWatt, 550), 1);
  const panelVmp = Math.max(n(form.panelVmp, 44.8), 1);
  const panelVoc = Math.max(n(form.panelVoc, 53.1), 1);
  const coeff = Math.max(n(form.panelTempCoeffVoc, 0.0024), 0);
  const coldVoc = panelVoc * (1 + coeff * Math.max(25 - n(form.minTemperature, 0), 0));
  const mpptMin = Math.max(n(form.mpptMinVoltage, 120), 1);
  const mpptMax = Math.max(n(form.mpptMaxVoltage, 220), mpptMin);
  const maxVoc = Math.max(n(form.controllerMaxVoc, 250), 1);
  const minSeries = Math.max(1, Math.ceil(mpptMin / panelVmp));
  const maxSeriesByMppt = Math.max(1, Math.floor(mpptMax / panelVmp));
  const maxSeriesByVoc = Math.max(1, Math.floor((maxVoc * 0.95) / coldVoc));
  const panelSeries = Math.max(1, Math.min(Math.max(minSeries, 1), Math.max(1, Math.min(maxSeriesByMppt, maxSeriesByVoc))));
  const psh = Math.max(n(form.sunHours, 5), 1);
  const pr = Math.max(0.4, Math.min(0.95, n(form.controllerEfficiency, 0.95) * n(form.cableLossFactor, 0.97) * n(form.panelLossFactor, 0.9) * n(form.shadingFactor, 0.95) * n(form.dustFactor, 0.96)));
  // پنل‌ها برای مصرف روزانه طراحی می‌شوند. اگر روز خودکفایی تعریف شود،
  // ظرفیت باتری برای همان تعداد روز افزایش می‌یابد و پنل‌ها فقط به اندازه شارژ منطقی بانک باتری تقویت می‌شوند.
  // در حالت متعادل، انرژی ذخیره‌شده خودکفایی در همان تعداد روز شارژ مجدد پخش می‌شود؛
  // بنابراین PV به جای چندبرابر شدن غیرمنطقی، مصرف روزانه + سهم شارژ روزانه باتری را پوشش می‌دهد.
  const rechargeDays = daysAutonomy > 0 ? Math.max(daysAutonomy, 1) : 0;
  const rechargeReserveWh = rechargeDays > 0 ? autonomyTargetWh / rechargeDays : 0;
  const requiredPanelWh = Math.max(effectiveDailyEnergyWh + rechargeReserveWh, demand.demandPowerW * 4);
  const requiredPanelCount = Math.max(1, Math.ceil((requiredPanelWh * panelFactor) / Math.max(panelWatt * psh * pr, 1)));
  const panelParallel = Math.max(1, Math.ceil(requiredPanelCount / panelSeries));
  const panelTotal = panelSeries * panelParallel;
  const stringVmp = panelSeries * panelVmp;
  const stringVocCold = panelSeries * coldVoc;
  const pvPower = panelTotal * panelWatt;
  const dailyProductionWh = pvPower * psh * pr;
  const mpptOk = stringVmp >= mpptMin && stringVmp <= mpptMax;
  const vocOk = stringVocCold < maxVoc;
  const voltageIssue = getBatteryVoltageIssue(systemVoltage, batteryVoltage);
  const baseAh = baseBackupWh > 0 ? (baseBackupWh / Math.max(systemVoltage * dod * inverterEff * batteryEff, 1)) : 0;
  const autonomyAh = autonomyTargetWh > 0 ? (autonomyTargetWh / Math.max(systemVoltage * dod * inverterEff * batteryEff, 1)) : 0;
  const addedAh = Math.max(requiredAh - baseAh, 0);
  const baseParallel = Math.max(1, Math.ceil((baseAh / Math.max(batteryAh, 1)) * batteryFactor));
  const addedParallel = Math.max(0, batteryParallel - baseParallel);
  // ظرفیت قابل استفاده واقعی بانک باتری برای تحلیل روزهای خودکفایی.
  // این مقدار قبلاً قبل از تعریف استفاده می‌شد و هنگام ورود به صفحه «تنظیمات سیستم» باعث crash و صفحه خالی می‌گردید.
  const usableBatteryWh = bankAh * systemVoltage * dod * inverterEff * batteryEff;
  const realAutonomyDays = effectiveDailyEnergyWh > 0 ? usableBatteryWh / effectiveDailyEnergyWh : 0;
  return { demand, systemVoltage, batteryVoltage, batteryAh, batteryFactor, panelFactor, daysAutonomy, effectiveDailyEnergyWh, baseBackupWh, autonomyTargetWh, autonomyExtraWh, targetWh, requiredAh, baseAh, autonomyAh, addedAh, baseParallel, addedParallel, rechargeDays, rechargeReserveWh, requiredPanelWh, usableBatteryWh, realAutonomyDays, batterySeries, batteryParallel, batteryTotal, bankAh, panelWatt, panelVmp, panelVoc, panelSeries, panelParallel, panelTotal, stringVmp, stringVocCold, pvPower, dailyProductionWh, mpptOk, vocOk, minSeries, mpptMin, mpptMax, maxVoc, voltageIssue };
}

function validateSolarDesign(form) {
  if (form.systemType === "backup") return { ok: true, messages: [] };
  const e = estimateSolarDesign(form);
  const selected = form.selectedEquipment || {};
  const messages = [];
  const inverter = selected.inverter ? EquipmentRepository.getById(selected.inverter) : null;
  const battery = selected.battery ? EquipmentRepository.getById(selected.battery) : null;
  const panel = selected.panel ? EquipmentRepository.getById(selected.panel) : null;
  // اگر تجهیز دستی انتخاب نشده باشد، سیستم از انتخاب هوشمند/داده‌های فعلی استفاده می‌کند و خطا فقط برای ناسازگاری واقعی صادر می‌شود.
  if (e.voltageIssue) messages.push(e.voltageIssue);
  if (!e.mpptOk) messages.push(`ولتاژ کاری آرایه پنل (${e.stringVmp.toFixed(1)}V) خارج از محدوده MPPT سانورتر (${e.mpptMin} تا ${e.mpptMax}V) است. تعداد پنل سری یا مدل پنل/سانورتر را اصلاح کنید.`);
  if (!e.vocOk) messages.push(`Voc سرد آرایه پنل (${e.stringVocCold.toFixed(1)}V) از حداکثر مجاز ورودی سانورتر (${e.maxVoc}V) بیشتر است. تعداد پنل سری را کم کنید یا سانورتر با ورودی بالاتر انتخاب کنید.`);
  if (inverter) {
    const rated = getEquipmentNumber(inverter, "ratedPowerW", 0);
    const surge = getEquipmentNumber(inverter, "surgePowerW", 0);
    if (rated && rated < e.demand.demandPowerW) messages.push(`توان سانورتر/اینورتر انتخابی (${rated.toFixed(0)}W) کمتر از نیاز بار (${e.demand.demandPowerW.toFixed(0)}W) است.`);
    if (surge && surge < e.demand.surgePowerW) messages.push(`توان راه‌اندازی سانورتر/اینورتر (${surge.toFixed(0)}W) کمتر از Surge موردنیاز (${e.demand.surgePowerW.toFixed(0)}W) است.`);
  }
  return { ok: messages.length === 0, messages, estimate: e };
}

function SolarDesignPreview() {
  const { activeProject } = useProjectStore();
  const form = activeProject.form;
  const estimate = useMemo(() => estimateSolarDesign(form), [form]);
  if (form.systemType === "backup") return null;
  const status = estimate.mpptOk && estimate.vocOk && !estimate.voltageIssue;
  return (
    <section className={`panel panel--soft ups-runtime-card ${status ? "ups-runtime-card--ok" : "ups-runtime-card--warn"}`}>
      <div className="panel__header">
        <div>
          <h3>نتیجه و کنترل هوشمند سیستم با پنل خورشیدی</h3>
          <p className="section-note">این بخش تمام ورودی‌های بالا را به خروجی قابل فهم تبدیل می‌کند: باتری، پنل، آرایش سری/موازی، ولتاژ MPPT و انرژی تولیدی.</p>
        </div>
        <span className="badge">{status ? "قابل محاسبه" : "نیازمند اصلاح"}</span>
      </div>
      {estimate.voltageIssue ? <div className="alert alert--warn">{estimate.voltageIssue}</div> : null}
      {!estimate.mpptOk ? <div className="alert alert--warn">ولتاژ کاری پنل‌ها {estimate.stringVmp.toFixed(1)}V است و باید بین {estimate.mpptMin} تا {estimate.mpptMax}V باشد. دلیل سری کردن پنل‌ها رسیدن به همین محدوده است.</div> : null}
      {!estimate.vocOk ? <div className="alert alert--warn">Voc سرد آرایه {estimate.stringVocCold.toFixed(1)}V است و از حد مجاز {estimate.maxVoc}V بیشتر شده است.</div> : null}
      <div className="metric-grid metric-grid--tight">
        <div className="metric-card"><div className="metric-card__label">تعداد کل پنل</div><div className="metric-card__value">{estimate.panelTotal}</div></div>
        <div className="metric-card metric-card--purple"><div className="metric-card__label">آرایش پنل</div><div className="metric-card__value">{estimate.panelSeries}S × {estimate.panelParallel}P</div></div>
        <div className="metric-card metric-card--green"><div className="metric-card__label">توان کل پنل</div><div className="metric-card__value">{estimate.pvPower.toFixed(0)} W</div></div>
        <div className="metric-card metric-card--amber"><div className="metric-card__label">تولید روزانه</div><div className="metric-card__value">{(estimate.dailyProductionWh/1000).toFixed(1)} kWh</div></div>
      </div>
      <div className="summary-list ups-runtime-summary">
        <div><span>ولتاژ سانورتر/اینورتر</span><strong>{estimate.systemVoltage}V</strong></div>
        <div><span>باتری</span><strong>{estimate.batteryVoltage}V / {estimate.batteryAh}Ah | ضریب {estimate.batteryFactor}</strong></div>
        <div><span>آرایش باتری</span><strong>{estimate.batterySeries === 1 ? `${estimate.batteryParallel} موازی` : `${estimate.batterySeries} سری × ${estimate.batteryParallel} موازی`} | خروجی <span dir="ltr">{estimate.systemVoltage}V / {estimate.bankAh.toFixed(0)}Ah</span></strong></div>
        <div><span>روزهای خودکفایی</span><strong>{estimate.daysAutonomy.toFixed(1)} روز | پیش‌فرض صفر است و با تغییر دستی، همین بخش زنده به‌روزرسانی می‌شود.</strong></div>
        <div><span>اثر خودکفایی روی باتری</span><strong>{estimate.daysAutonomy > 0 ? `برای رسیدن به ${estimate.daysAutonomy.toFixed(1)} روز خودکفایی، مصرف روزانه مبنا ${(estimate.effectiveDailyEnergyWh/1000).toFixed(1)}kWh در نظر گرفته شده و ظرفیت هدف باتری حدود ${estimate.requiredAh.toFixed(0)}Ah محاسبه شده است. ظرفیت نسبت به حالت پایه حدود ${estimate.addedAh.toFixed(0)}Ah افزایش یافته و آرایش از ${estimate.batterySeries === 1 ? `${estimate.baseParallel} موازی` : `${estimate.batterySeries} سری × ${estimate.baseParallel} موازی`} به ${estimate.batterySeries === 1 ? `${estimate.batteryParallel} موازی` : `${estimate.batterySeries} سری × ${estimate.batteryParallel} موازی`} تغییر کرده است.` : `روز خودکفایی صفر است؛ افزایش اجباری ظرفیت اعمال نشده است. با همین بانک باتری، ذخیره واقعی حدود ${estimate.realAutonomyDays.toFixed(2)} روز بر اساس مصرف فعلی قابل انتظار است.`}</strong></div>
        <div><span>پنل</span><strong>{estimate.panelWatt}W | Vmp {estimate.panelVmp}V | Voc {estimate.panelVoc}V | ضریب {estimate.panelFactor}</strong></div>
        <div><span>دلیل سری پنل</span><strong>{estimate.panelSeries} عدد سری انتخاب شده تا ولتاژ آرایه به محدوده کاری MPPT برسد.</strong></div>
        <div><span>دلیل موازی پنل</span><strong>{estimate.panelParallel} رشته موازی برای افزایش توان و انرژی تولیدی روزانه در نظر گرفته شده است.</strong></div>
        <div><span>اثر خودکفایی روی پنل</span><strong>{estimate.daysAutonomy > 0 ? `نیاز تولید روزانه بر اساس مصرف حدود ${(estimate.effectiveDailyEnergyWh/1000).toFixed(1)}kWh است. برای خودکفایی، ظرفیت باتری افزایش یافته و پنل‌ها در حالت متعادل علاوه بر مصرف، حدود ${(estimate.rechargeReserveWh/1000).toFixed(1)}kWh/day انرژی شارژ مجدد باتری را پوشش می‌دهند؛ بنابراین نیاز طراحی PV حدود ${(estimate.requiredPanelWh/1000).toFixed(1)}kWh/day است.` : `روز خودکفایی صفر است؛ تعداد پنل فقط بر اساس مصرف روزانه، تابش شهر، ضرایب تلفات و ضریب پنل محاسبه شده است. ظرفیت فعلی باتری ذخیره واقعی ایجاد می‌کند، اما به عنوان هدف خودکفایی به طراحی تحمیل نشده است.`}</strong></div>
        {estimate.dailyProductionWh > estimate.requiredPanelWh * 1.35 ? <div><span>هشدار طراحی</span><strong>توان تولیدی پنل‌ها بیش از نیاز طراحی است؛ این موضوع هزینه را افزایش می‌دهد اما ضریب اطمینان و سرعت شارژ باتری را بهتر می‌کند.</strong></div> : null}
        <div><span>کنترل MPPT</span><strong>Vmp رشته: {estimate.stringVmp.toFixed(1)}V / Voc سرد: {estimate.stringVocCold.toFixed(1)}V</strong></div>
      </div>
    </section>
  );
}

function validateBackupDesign(form) {
  if (form.systemType !== "backup") return { ok: true, messages: [] };
  const estimate = estimateUpsRuntime(form);
  const selected = form.selectedEquipment || {};
  const messages = [];
  const inverter = selected.inverter ? EquipmentRepository.getById(selected.inverter) : null;
  const battery = selected.battery ? EquipmentRepository.getById(selected.battery) : null;
  const designFactor = Math.max(parseFaNumber(form.designFactor, 1.2) || 1.2, 1);
  const requiredContinuousW = estimate.demandPowerW * designFactor;
  if (!inverter) messages.push("برای محاسبه تامین برق اضطراری با باتری باید سانورتر از بانک تجهیزات انتخاب شود.");
  if (!battery) messages.push("برای محاسبه تامین برق اضطراری با باتری باید باتری از بانک تجهیزات انتخاب شود.");
  if (inverter) {
    const ratedPowerW = getEquipmentNumber(inverter, "ratedPowerW", 0);
    const surgePowerW = getEquipmentNumber(inverter, "surgePowerW", 0);
    if (ratedPowerW < requiredContinuousW) messages.push(`توان سانورتر انتخابی کم است. حداقل توان پیشنهادی با ضریب ایمنی ${requiredContinuousW.toFixed(0)} وات است ولی تجهیز انتخابی ${ratedPowerW.toFixed(0)} وات است.`);
    if (surgePowerW && surgePowerW < estimate.surgePowerW) messages.push(`توان لحظه‌ای سانورتر انتخابی کم است. نیاز تقریبی ${estimate.surgePowerW.toFixed(0)} وات و ظرفیت Surge تجهیز ${surgePowerW.toFixed(0)} وات است.`);
  }
  if (battery) {
    const systemVoltage = parseFaNumber(form.systemVoltage, 48) || 48;
    const batteryVoltage = getEquipmentNumber(battery, "batteryUnitVoltage", parseFaNumber(form.batteryUnitVoltage, 12) || 12);
    const voltageIssue = getBatteryVoltageIssue(systemVoltage, batteryVoltage);
    if (voltageIssue) messages.push(voltageIssue);
  }
  if (estimate.realBackupHours + 0.05 < estimate.desiredBackupHours) messages.push(`زمان برق اضطراری واقعی (${estimate.realBackupHours.toFixed(1)} ساعت) کمتر از نیاز مشتری (${estimate.desiredBackupHours.toFixed(1)} ساعت) است. تعداد موازی باتری یا ظرفیت باتری را افزایش دهید.`);
  return { ok: messages.length === 0, messages, estimate };
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

  const seriesCount = isSameVoltageRange(systemVoltage, batteryUnitVoltage) ? 1 : Math.max(1, Math.ceil(systemVoltage / Math.max(batteryUnitVoltage, 1)));
  const requiredAhForDesired = (demandPowerW * num(form.backupHours, 1)) / (systemVoltage * inverterEfficiency * dod * batteryEfficiency);
  const calculatedParallelCount = Math.max(1, Math.ceil(requiredAhForDesired / Math.max(batteryUnitAh, 1)));
  const manualParallelCount = Math.max(0, Math.ceil(num(form.backupParallelCount, 0)));
  const parallelCount = manualParallelCount > 0 ? manualParallelCount : calculatedParallelCount;
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
    calculatedParallelCount,
    manualParallelCount,
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
  const voltageIssue = getBatteryVoltageIssue(parseFaNumber(form.systemVoltage, 48), parseFaNumber(form.batteryUnitVoltage, 12));

  return (
    <section className={`panel panel--soft ups-runtime-card ${statusClass}`}>
      <div className="panel__header">
        <div>
          <h3>محاسبه تأمین برق اضطراری با باتری</h3>
          <p className="section-note">انتخاب باتری و سانورتر از بانک تجهیزات، قانون محاسبات را تعیین می‌کند. اگر تعداد باتری خالی بماند برنامه تعداد لازم را خودش محاسبه می‌کند؛ اگر عدد وارد شود همان عدد مبنای محاسبه قرار می‌گیرد.</p>
        </div>
        <span className="badge">{statusText}</span>
      </div>
      {voltageIssue ? <div className="alert alert--warn">{voltageIssue}</div> : null}

      <div className="form-grid two-cols">
        <Field label="ساعت برق اضطراری موردنیاز مشتری">
          <input type="text" inputMode="decimal" step="0.5" min="0.5" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} />
        </Field>
        <Field label="توان بار محاسبه‌شده">
          <input readOnly value={`${estimate.demandPowerW.toFixed(0)} W`} />
        </Field>
        <Field label="تعداد باتری / رشته موازی" hint="خالی بماند یعنی محاسبه هوشمند. اگر عدد وارد کنید، همان تعداد در محاسبه زمان واقعی اعمال می‌شود.">
          <input type="text" inputMode="numeric" value={form.backupParallelCount ?? ""} onChange={(e) => updateForm({ backupParallelCount: e.target.value })} placeholder={`${estimate.calculatedParallelCount} پیشنهادی`} />
        </Field>
      </div>

      <div className="metric-grid metric-grid--tight">
        <div className="metric-card">
          <div className="metric-card__label">برق اضطراری واقعی</div>
          <div className="metric-card__value">{estimate.realBackupHours.toFixed(1)} h</div>
        </div>
        <div className="metric-card metric-card--purple">
          <div className="metric-card__label">آرایش باتری</div>
          <div className="metric-card__value">{estimate.seriesCount === 1 ? `${estimate.parallelCount} موازی` : `${estimate.seriesCount}S × ${estimate.parallelCount}P`}</div>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-card__label">تعداد کل باتری</div>
          <div className="metric-card__value">{estimate.totalCount}</div>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-card__label">انرژی قابل استفاده</div>
          <div className="metric-card__value">{(estimate.usableEnergyWh / 1000).toFixed(1)} kWh</div>
        </div>
      </div>

      <div className="summary-list ups-runtime-summary">
        <div><span>زمان مورد نیاز مشتری</span><strong>{estimate.desiredBackupHours.toFixed(1)} ساعت</strong></div>
        <div><span>زمان برق اضطراری واقعی</span><strong>{estimate.realBackupHours.toFixed(1)} ساعت</strong></div>
        <div><span>ولتاژ باتری انتخابی</span><strong>{form.batteryUnitVoltage}V</strong></div>
        <div><span>ظرفیت هر باتری</span><strong>{form.batteryUnitAh}Ah</strong></div>
        <div><span>تعداد باتری مورد نیاز</span><strong>{estimate.totalCount} عدد</strong></div>
        <div><span>ظرفیت نهایی بانک</span><strong>{estimate.bankAh.toFixed(0)}Ah @ {form.systemVoltage}V</strong></div>
        <div><span>منطق باتری</span><strong>{estimate.seriesCount === 1 ? `باتری ${form.batteryUnitVoltage}V با سانورتر ${form.systemVoltage}V هم‌خوان است؛ بنابراین ${estimate.parallelCount} باتری فقط موازی می‌شوند تا ظرفیت به ${estimate.bankAh.toFixed(0)}Ah برسد.` : `برای رسیدن به ${form.systemVoltage}V در هر رشته ${estimate.seriesCount} باتری سری می‌شود؛ سپس ${estimate.parallelCount} رشته موازی می‌شود تا ظرفیت Ah و زمان برق اضطراری افزایش یابد.`}</strong></div>
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
  const { activeProject, updateForm } = useProjectStore();
  const form = activeProject?.form || {};
  const availableSystemVoltages = form.systemType === "backup" ? BACKUP_SYSTEM_VOLTAGES : SYSTEM_VOLTAGES;
  const availableBatteryVoltages = form.systemType === "backup"
    ? BATTERY_UNIT_VOLTAGE_OPTIONS.filter((voltage) => voltage <= Number(form.systemVoltage) && Number(form.systemVoltage) % voltage === 0)
    : BATTERY_UNIT_VOLTAGE_OPTIONS;
  const smartRecommendation = useMemo(() => {
    try {
      return buildSmartSystemRecommendation(form);
    } catch (error) {
      console.error("Smart recommendation failed", error);
      return { patch: {}, summary: {}, error };
    }
  }, [form]);
  const backupRecommendation = useMemo(() => {
    try {
      return form.systemType === "backup" ? buildBackupEquipmentRecommendation(form) : null;
    } catch (error) {
      console.error("Backup recommendation failed", error);
      return null;
    }
  }, [form]);

  useEffect(() => {
    if (form.systemType !== "backup" || !backupRecommendation) return;
    const patch = backupRecommendation.patch || {};
    const selected = form.selectedEquipment || {};
    const needsSmartEquipment = !selected.inverter || !selected.battery;
    const needsSync = needsSmartEquipment
      || String(form.systemVoltage) !== String(patch.systemVoltage)
      || String(form.batteryUnitVoltage) !== String(patch.batteryUnitVoltage)
      || String(form.batteryUnitAh) !== String(patch.batteryUnitAh)
      || String(form.batteryType) !== String(patch.batteryType)
      || String(form.dod) !== String(patch.dod);
    if (!needsSync) return;
    updateForm(patch);
  }, [form.systemType, form.selectedEquipment?.inverter, form.selectedEquipment?.battery, form.systemVoltage, form.batteryUnitVoltage, form.batteryUnitAh, form.batteryType, form.dod, backupRecommendation, updateForm]);

  useEffect(() => {
    if (form.systemType === "backup") return;
    const patch = smartRecommendation.patch || {};
    const selected = form.selectedEquipment || {};
    const needsAuto = !selected.panel || !selected.battery || !selected.inverter;
    if (!needsAuto) return;
    const safePatch = { ...patch, batteryType: "LFP", daysAutonomy: patch.daysAutonomy ?? form.daysAutonomy ?? "0" };
    updateForm(safePatch);
  }, [form.systemType, form.selectedEquipment?.panel, form.selectedEquipment?.battery, form.selectedEquipment?.inverter, smartRecommendation, updateForm]);

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

    const specs = { ...(item.specs || {}) };
    if (role === "battery") {
      const type = normalizeBatteryType(specs.batteryType || form.batteryType);
      specs.batteryType = type;
      specs.dod = getDefaultDodForBatteryType(type);
    }
    updateForm({
      selectedEquipment: {
        ...(form.selectedEquipment || {}),
        [role]: item.id,
      },
      ...specs,
      ...(role === "inverter" && item.specs?.systemVoltage ? {
        systemVoltage: String(item.specs.systemVoltage),
      } : {}),
    });
  }

  return (
    <div className="stack-lg">
      <section className="panel panel--soft">
        <div className="panel__header">
          <div>
            <h3>انتخاب از بانک تجهیزات</h3>
            {form.systemType !== "backup" ? <p className="section-note">مسیر محاسبه: سیستم با پنل خورشیدی — تجهیزات تا زمانی که انتخاب دستی انجام نشود، به صورت هوشمند از بانک انتخاب می‌شوند.</p> : null}
          </div>
          {form.systemType !== "backup" ? <span className="badge">انتخاب هوشمند فعال</span> : null}
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

      <div className="form-grid two-cols">
        <Field label="ولتاژ سیستم">
          {form.systemType === "backup" ? <input readOnly value={`${form.systemVoltage}V`} /> : <select value={form.systemVoltage} onChange={(e) => updateForm({ systemVoltage: e.target.value })}>{availableSystemVoltages.map((v) => <option key={v} value={v}>{v}V</option>)}</select>}
        </Field>
        <Field label="نوع باتری">
          <select value={form.batteryType} onChange={(e) => updateForm({ batteryType: e.target.value, dod: String(getDefaultDodForBatteryType(e.target.value)) })}>{BATTERY_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        </Field>
        {form.systemType === "hybrid" ? (
          <Field label="استراتژی هیبرید">
            <select value={form.hybridMode} onChange={(e) => updateForm({ hybridMode: e.target.value })}>{HYBRID_MODES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
          </Field>
        ) : null}
        {form.systemType === "gridtie" ? (
          <Field label="هدف جبران انرژی (%)"><input type="text" inputMode="decimal" value={form.targetOffsetPercent} onChange={(e) => updateForm({ targetOffsetPercent: e.target.value })} /></Field>
        ) : null}
        <Field label="ظرفیت واحد باتری (Ah)" hint="پیش‌فرض ۱۰۰Ah است؛ متناسب با نیاز مشتری و زمان بکاپ قابل ویرایش است.">
          <input
            type="text"
            inputMode="decimal"
            list="battery-capacity-options"
            value={form.batteryUnitAh}
            onChange={(e) => updateForm({ batteryUnitAh: e.target.value })}
          />
          <datalist id="battery-capacity-options">{BACKUP_BATTERY_CAPACITY_OPTIONS.map((v) => <option key={v} value={v}>{v}Ah</option>)}</datalist>
        </Field>
        {form.systemType !== "backup" ? <Field label="ضریب افزایش باتری" hint="برای رزرو ظرفیت و تعیین تعداد نهایی باتری؛ مثلا ۱.۲ یعنی ۲۰٪ ظرفیت بیشتر.">
          <input type="text" inputMode="decimal" step="0.05" value={form.batteryFactor ?? 1} onChange={(e) => updateForm({ batteryFactor: e.target.value })} />
        </Field> : null}
        <Field label="ولتاژ واحد باتری (V)">{form.systemType === "backup" ? (
          <input readOnly value={`${form.batteryUnitVoltage}V`} />
        ) : (
          <input type="text" inputMode="decimal" value={form.batteryUnitVoltage} onChange={(e) => updateForm({ batteryUnitVoltage: e.target.value })} />
        )}</Field>
        {form.systemType !== "backup" ? <Field label="روزهای خودکفایی"><input type="text" inputMode="decimal" step="0.1" value={form.daysAutonomy} onChange={(e) => updateForm({ daysAutonomy: e.target.value })} /></Field> : <Field label="زمان برق اضطراری مورد نیاز (ساعت)"><input type="text" inputMode="decimal" step="0.5" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} /></Field>}
        <Field label="عمق دشارژ DoD"><input type="text" inputMode="decimal" step="0.01" value={form.dod} onChange={(e) => updateForm({ dod: e.target.value })} /></Field>
        <Field label="راندمان اینورتر"><input type="text" inputMode="decimal" step="0.01" value={form.inverterEfficiency} onChange={(e) => updateForm({ inverterEfficiency: e.target.value })} /></Field>
        <Field label="راندمان رفت‌وبرگشت باتری"><input type="text" inputMode="decimal" step="0.01" value={form.batteryRoundTripEfficiency} onChange={(e) => updateForm({ batteryRoundTripEfficiency: e.target.value })} /></Field>
        {form.systemType !== "backup" ? <Field label="راندمان MPPT داخلی"><input type="text" inputMode="decimal" step="0.01" value={form.controllerEfficiency} onChange={(e) => updateForm({ controllerEfficiency: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="توان پنل (W)"><input type="text" inputMode="decimal" value={form.panelWatt} onChange={(e) => updateForm({ panelWatt: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="Voc پنل"><input type="text" inputMode="decimal" step="0.1" value={form.panelVoc} onChange={(e) => updateForm({ panelVoc: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="Vmp پنل"><input type="text" inputMode="decimal" step="0.1" value={form.panelVmp} onChange={(e) => updateForm({ panelVmp: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="حداکثر Voc ورودی MPPT"><input type="text" inputMode="decimal" value={form.controllerMaxVoc} onChange={(e) => updateForm({ controllerMaxVoc: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="حداقل MPPT"><input type="text" inputMode="decimal" value={form.mpptMinVoltage} onChange={(e) => updateForm({ mpptMinVoltage: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="حداکثر MPPT"><input type="text" inputMode="decimal" value={form.mpptMaxVoltage} onChange={(e) => updateForm({ mpptMaxVoltage: e.target.value })} /></Field> : null}
        <Field label="ضریب طراحی"><input type="text" inputMode="decimal" step="0.01" value={form.designFactor} onChange={(e) => updateForm({ designFactor: e.target.value })} /></Field>
        {form.systemType !== "backup" ? <Field label="طول مسیر کابل DC پنل (m)" hint="فقط برای مسیر پنل خورشیدی."><input type="text" inputMode="decimal" step="0.1" value={form.dcCableLength ?? ""} onChange={(e) => updateForm({ dcCableLength: e.target.value })} /></Field> : null}
        <Field label="طول مسیر کابل AC (m)" hint="برای محاسبه افت مسیر خروجی AC. در صورت عدم ورود، مقدار پیش‌فرض استفاده می‌شود."><input type="text" inputMode="decimal" step="0.1" value={form.acCableLength ?? ""} onChange={(e) => updateForm({ acCableLength: e.target.value })} /></Field>
        <Field label="طول کابل باتری (m)"><input type="text" inputMode="decimal" step="0.1" value={form.batteryCableLength ?? ""} onChange={(e) => updateForm({ batteryCableLength: e.target.value })} /></Field>
        {form.systemType !== "backup" ? <Field label="افت مجاز کابل DC پنل (%)"><input type="text" inputMode="decimal" step="0.1" value={form.dcVoltageDropLimit} onChange={(e) => updateForm({ dcVoltageDropLimit: e.target.value })} /></Field> : null}
        <Field label="افت مجاز کابل باتری (%)"><input type="text" inputMode="decimal" step="0.1" value={form.batteryVoltageDropLimit} onChange={(e) => updateForm({ batteryVoltageDropLimit: e.target.value })} /></Field>
        <Field label="افت مجاز کابل AC (%)"><input type="text" inputMode="decimal" step="0.1" value={form.acVoltageDropLimit} onChange={(e) => updateForm({ acVoltageDropLimit: e.target.value })} /></Field>
        <Field label="ضریب تلفات کابل"><input type="text" inputMode="decimal" step="0.01" value={form.cableLossFactor} onChange={(e) => updateForm({ cableLossFactor: e.target.value })} /></Field>
        {form.systemType !== "backup" ? <Field label="ضریب تلفات پنل"><input type="text" inputMode="decimal" step="0.01" value={form.panelLossFactor} onChange={(e) => updateForm({ panelLossFactor: e.target.value })} /></Field> : null}
        {form.systemType !== "backup" ? <Field label="ضریب افزایش پنل" hint="برای رزرو ظرفیت پنل؛ مثلا ۱.۲ یعنی ۲۰٪ پنل بیشتر."><input type="text" inputMode="decimal" step="0.05" value={form.panelFactor ?? 1} onChange={(e) => updateForm({ panelFactor: e.target.value })} /></Field> : null}
        <Field label="ضریب Surge پیش‌فرض"><input type="text" inputMode="decimal" step="0.1" value={form.surgeFactor} onChange={(e) => updateForm({ surgeFactor: e.target.value })} /></Field>
      </div>

      {form.systemType === "backup" ? <UpsRuntimePreview /> : null}

      {form.systemType !== "backup" ? <SolarDesignPreview /> : null}
    </div>
  );
}

function StepReview() {
  const { activeProject } = useProjectStore();
  const form = activeProject.form;
  const systemLabel = SYSTEM_TYPES.find((item) => item.value === form.systemType)?.label || form.systemType;
  const modeLabel = CALCULATION_MODES.find((item) => item.value === form.calculationMode)?.label || form.calculationMode;
  const selectedCount = [form.systemType !== "backup" ? form.selectedEquipment?.panel : null, form.selectedEquipment?.battery, form.selectedEquipment?.inverter].filter(Boolean).length;
  const loadItems = form.loadItems || [];
  const loadTotals = loadItems.reduce((acc, item) => {
    const qty = parseFaNumber(item.qty, 1);
    const power = parseFaNumber(item.power, 0);
    const hours = parseFaNumber(item.hours, 0);
    const coincidence = parseFaNumber(item.coincidenceFactor, 1);
    const dailyKwh = parseFaNumber(item.dailyKwh, 0);
    acc.connectedPowerW += qty * power;
    acc.realPowerW += qty * power * coincidence;
    acc.dailyWh += dailyKwh > 0 ? qty * dailyKwh * 1000 : qty * power * hours * coincidence;
    return acc;
  }, { connectedPowerW: 0, realPowerW: 0, dailyWh: 0 });
  const warnings = [];
  if (form.calculationMode === "loads" && !loadItems.length) warnings.push("هیچ مصرف‌کننده‌ای انتخاب نشده است.");
  if (form.systemType !== "backup" && (!form.dcCableLength || Number(form.dcCableLength) <= 0)) warnings.push("طول کابل DC پنل وارد نشده؛ افت پیش‌فرض استفاده می‌شود.");
  if (!form.acCableLength || Number(form.acCableLength) <= 0) warnings.push("طول کابل AC وارد نشده؛ افت پیش‌فرض استفاده می‌شود.");
  const reviewVoltageIssue = getBatteryVoltageIssue(parseFaNumber(form.systemVoltage, 48), parseFaNumber(form.batteryUnitVoltage, 48));
  if (reviewVoltageIssue) warnings.push(reviewVoltageIssue);

  return (
    <div className="review-dashboard">
      <section className="panel panel--soft review-section-card">
        <div className="panel__header"><h3>چکیده نهایی قبل از محاسبه</h3><span className="badge">قابل بازگشت و ویرایش</span></div>
        <p className="section-note">این صفحه خلاصه همه انتخاب‌های مشتری است. قبل از اجرای محاسبات، موارد زیر را کنترل کنید.</p>
      </section>
      <div className="review-card-grid">
        <section className="panel review-section-card"><h3>اطلاعات پروژه</h3><div className="summary-list"><div><span>عنوان پروژه</span><strong>{form.projectTitle}</strong></div><div><span>نام کارفرما</span><strong>{form.clientName || "—"}</strong></div><div><span>شهر / تابش</span><strong>{form.systemType !== "backup" ? (form.city + " / " + form.sunHours + " h") : "سانورتر و باتری بدون پنل"}</strong></div></div></section>
        <section className="panel review-section-card"><h3>نوع سیستم و روش محاسبه</h3><div className="summary-list"><div><span>نوع سیستم</span><strong>{systemLabel}</strong></div><div><span>روش محاسبه</span><strong>{modeLabel}</strong></div><div><span>ولتاژ سیستم</span><strong>{form.systemVoltage}V</strong></div><div><span>تجهیزات انتخاب‌شده</span><strong>{selectedCount} مورد</strong></div></div></section>
        <section className="panel review-section-card"><h3>مدل بار</h3><div className="summary-list"><div><span>تعداد بارها</span><strong>{loadItems.length} مورد</strong></div><div><span>توان نصب‌شده</span><strong>{loadTotals.connectedPowerW.toFixed(0)} W</strong></div><div><span>توان همزمان تقریبی</span><strong>{loadTotals.realPowerW.toFixed(0)} W</strong></div><div><span>مصرف روزانه</span><strong>{(loadTotals.dailyWh / 1000 || Number(form.dailyEnergyKwh) || 0).toFixed(1)} kWh/day</strong></div><div><span>{form.systemType === "backup" ? "زمان برق اضطراری" : "روزهای خودکفایی"}</span><strong>{form.systemType === "backup" ? `${form.backupHours} h` : `${form.daysAutonomy} روز`}</strong></div></div></section>
        <section className="panel review-section-card"><h3>تنظیمات باتری و کابل</h3><div className="summary-list"><div><span>نوع باتری</span><strong>{form.batteryType}</strong></div><div><span>واحد باتری</span><strong>{form.batteryUnitVoltage}V / {form.batteryUnitAh}Ah</strong></div><div><span>ضریب باتری</span><strong>{form.batteryFactor ?? 1}</strong></div><div><span>DoD / راندمان باتری</span><strong>{form.dod} / {form.batteryRoundTripEfficiency}</strong></div><div><span>{form.systemType === "backup" ? "کابل AC / باتری" : "کابل DC پنل / AC / باتری"}</span><strong>{form.systemType === "backup" ? `${form.acCableLength || "پیش‌فرض"}m / ${form.batteryCableLength || "پیش‌فرض"}m` : `${form.dcCableLength || "پیش‌فرض"}m / ${form.acCableLength || "پیش‌فرض"}m / ${form.batteryCableLength || "پیش‌فرض"}m`}</strong></div></div></section>
      </div>
      {warnings.length ? <section className="panel panel--soft review-warning-card"><h3>هشدارهای قابل بررسی</h3><ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section> : null}
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
  const { activeProject, stepIndex, nextStep, prevStep, runCalculation, saveProject, goDashboard, openScenarios } = useProjectStore();
  const safeStepIndex = Math.max(0, Math.min(Number(stepIndex) || 0, stepMap.length - 1));
  const CurrentStep = stepMap[safeStepIndex]?.component || StepProjectInfo;

  function handleNextOrCalculate() {
    if (activeProject.form.systemType === "backup" && stepIndex >= 5) {
      const validation = validateBackupDesign(activeProject.form);
      if (!validation.ok) {
        window.alert(`امکان رفتن به محاسبات وجود ندارد:\n\n${validation.messages.join("\n")}`);
        return;
      }
      runCalculation();
      return;
    }
    if (activeProject.form.systemType !== "backup" && stepIndex === 5) {
      const validation = validateSolarDesign(activeProject.form);
      if (!validation.ok) {
        window.alert(`امکان رفتن به مرحله بعد وجود ندارد:\n\n${validation.messages.join("\n")}`);
        return;
      }
    }
    nextStep();
  }

  function handleRunCalculation() {
    if (activeProject.form.systemType !== "backup") {
      const validation = validateSolarDesign(activeProject.form);
      if (!validation.ok) {
        window.alert(`امکان اجرای محاسبات وجود ندارد:\n\n${validation.messages.join("\n")}`);
        return;
      }
    }
    if (activeProject.form.systemType === "backup") {
      const validation = validateBackupDesign(activeProject.form);
      if (!validation.ok) {
        window.alert(`امکان اجرای محاسبات وجود ندارد:\n\n${validation.messages.join("\n")}`);
        return;
      }
    }
    runCalculation();
  }

  return (
    <div className="shell">
      <header className="topbar topbar--workspace" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.92), rgba(15,23,42,0.82)), url(${PUBLIC_ASSETS.backgrounds.workspace})` }}>
        <div className="topbar__actions"><button className="btn btn--ghost" onClick={goDashboard}>بازگشت به داشبورد</button><button className="btn btn--ghost" type="button" onClick={prevStep}>بازگشت به صفحه قبل</button><button className="btn btn--secondary" type="button" onClick={() => openScenarios("workspace")}>سناریوهای آماده</button></div>
        <div className="topbar__title topbar__title--brand"><img src={PUBLIC_ASSETS.branding.appLogo} alt="SDS" className="topbar__brand-logo" /> <span>Solar Design Suite / Workspace</span></div>
      </header>
      <WizardShell
        title={stepMap[safeStepIndex]?.title || stepMap[0].title}
        actions={(
          <>
            <button type="button" className="btn btn--ghost" onClick={prevStep}>مرحله قبل</button>
            <button type="button" className="btn btn--secondary" onClick={saveProject}>ذخیره پیش‌نویس</button>
            {stepIndex === stepMap.length - 1 ? (
              <button type="button" className="btn btn--primary" onClick={handleRunCalculation}>اجرای محاسبات</button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={handleNextOrCalculate}>{activeProject.form.systemType === "backup" && stepIndex === 5 ? "محاسبه نهایی" : "مرحله بعد"}</button>
            )}
          </>
        )}
      >
        <CurrentStep />
      </WizardShell>
    </div>
  );
}
