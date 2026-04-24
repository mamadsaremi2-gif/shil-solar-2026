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
  PANEL_TYPES,
  LOAD_TYPES,
  HYBRID_MODES,
} from "../domain/models/project";
import { Field } from "../shared/components/Field";
import { EquipmentRepository } from "../data/repositories/EquipmentRepository";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";

function StepProjectInfo() {
  const { activeProject, updateForm } = useProjectStore();
  const form = activeProject.form;
  return (
    <div className="form-grid two-cols">
      <Field label="عنوان پروژه"><input value={form.projectTitle} onChange={(e) => updateForm({ projectTitle: e.target.value })} /></Field>
      <Field label="نام کارفرما"><input value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} /></Field>
      <Field label="شهر"><input value={form.city} onChange={(e) => updateForm({ city: e.target.value })} /></Field>
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
          <input type="number" value={activeProject.form.dailyEnergyKwh} onChange={(e) => updateForm({ dailyEnergyKwh: e.target.value })} />
        </Field>
        <Field label="Peak Factor" hint="برای بررسی پیک طراحی در کنار پروفایل">
          <input type="number" step="0.1" value={activeProject.form.peakFactor} onChange={(e) => updateForm({ peakFactor: e.target.value })} />
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
              type="number"
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

function StepLoads() {
  const { activeProject, updateForm, updateLoadItem, addLoadItem, removeLoadItem } = useProjectStore();
  const form = activeProject.form;
  if (form.calculationMode === "loads") {
    return (
      <div className="stack-lg">
        <div className="table-like">
          {form.loadItems.map((item) => (
            <div key={item.id} className="load-card-grid">
              <input value={item.name} onChange={(e) => updateLoadItem(item.id, { name: e.target.value })} placeholder="نام بار" />
              <input type="number" value={item.qty} onChange={(e) => updateLoadItem(item.id, { qty: e.target.value })} placeholder="تعداد" />
              <input type="number" value={item.power} onChange={(e) => updateLoadItem(item.id, { power: e.target.value })} placeholder="توان" />
              <input type="number" value={item.hours} onChange={(e) => updateLoadItem(item.id, { hours: e.target.value })} placeholder="ساعت کار" />
              <input type="number" step="0.01" value={item.powerFactor ?? 0.95} onChange={(e) => updateLoadItem(item.id, { powerFactor: e.target.value })} placeholder="PF" />
              <input type="number" step="0.01" value={item.coincidenceFactor ?? 1} onChange={(e) => updateLoadItem(item.id, { coincidenceFactor: e.target.value })} placeholder="ضریب همزمانی" />
              <select value={item.loadType ?? "mixed"} onChange={(e) => updateLoadItem(item.id, { loadType: e.target.value })}>
                {LOAD_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <input type="number" step="0.1" value={item.surgeFactor ?? 1} onChange={(e) => updateLoadItem(item.id, { surgeFactor: e.target.value })} placeholder="ضریب راه‌اندازی" />
              <button type="button" className="btn btn--ghost" onClick={() => removeLoadItem(item.id)}>حذف</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--secondary" onClick={addLoadItem}>افزودن بار</button>
      </div>
    );
  }

  if (form.calculationMode === "load_profile") {
    return <LoadProfileEditor />;
  }

  return (
    <div className="form-grid two-cols">
      {form.calculationMode === "current" ? (
        <Field label="جریان کل (A)"><input type="number" value={form.current} onChange={(e) => updateForm({ current: e.target.value })} /></Field>
      ) : null}
      {form.calculationMode === "power" ? (
        <Field label="توان کل (W)"><input type="number" value={form.loadPower} onChange={(e) => updateForm({ loadPower: e.target.value })} /></Field>
      ) : null}
      {form.calculationMode === "daily_energy" ? (
        <Field label="انرژی روزانه (kWh/day)"><input type="number" value={form.dailyEnergyKwh} onChange={(e) => updateForm({ dailyEnergyKwh: e.target.value })} /></Field>
      ) : null}
      <Field label="ولتاژ بار (V)"><input type="number" value={form.loadVoltage} onChange={(e) => updateForm({ loadVoltage: e.target.value })} /></Field>
      <Field label="ضریب توان PF"><input type="number" step="0.01" value={form.powerFactor} onChange={(e) => updateForm({ powerFactor: e.target.value })} /></Field>
      <Field label="زمان بکاپ / مرجع (h)"><input type="number" value={form.backupHours} onChange={(e) => updateForm({ backupHours: e.target.value })} /></Field>
      {form.calculationMode === "daily_energy" ? (
        <Field label="Peak Factor"><input type="number" step="0.1" value={form.peakFactor} onChange={(e) => updateForm({ peakFactor: e.target.value })} /></Field>
      ) : null}
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
    <div className="form-grid two-cols">
      <Field label="ساعات تابش موثر"><input type="number" value={form.sunHours} onChange={(e) => updateForm({ sunHours: e.target.value })} /></Field>
      <Field label="دمای متوسط (°C)"><input type="number" value={form.averageTemperature} onChange={(e) => updateForm({ averageTemperature: e.target.value })} /></Field>
      <Field label="حداقل دما (°C)"><input type="number" value={form.minTemperature} onChange={(e) => updateForm({ minTemperature: e.target.value })} /></Field>
      <Field label="حداکثر دما (°C)"><input type="number" value={form.maxTemperature} onChange={(e) => updateForm({ maxTemperature: e.target.value })} /></Field>
      <Field label="ارتفاع از سطح دریا (m)"><input type="number" value={form.altitude} onChange={(e) => updateForm({ altitude: e.target.value })} /></Field>
      <Field label="ضریب سایه"><input type="number" step="0.01" value={form.shadingFactor} onChange={(e) => updateForm({ shadingFactor: e.target.value })} /></Field>
      <Field label="ضریب گردوغبار"><input type="number" step="0.01" value={form.dustFactor} onChange={(e) => updateForm({ dustFactor: e.target.value })} /></Field>
      <Field label="زاویه نصب"><input type="number" value={form.tiltAngle} onChange={(e) => updateForm({ tiltAngle: e.target.value })} /></Field>
    </div>
  );
}

function EquipmentSelector({ category, label, selectedId, onSelect, disabled = false }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => EquipmentRepository.search({ category, query }), [category, query]);
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
            onSelect={(item) => applyEquipment("inverter", item)}
          />
          {form.systemType !== "backup" ? (
            <EquipmentSelector
              category="controller"
              label="شارژ کنترلر"
              selectedId={form.selectedEquipment?.controller}
              onSelect={(item) => applyEquipment("controller", item)}
            />
          ) : null}
        </div>
      </section>

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
        <Field label="هدف جبران انرژی (%)"><input type="number" value={form.targetOffsetPercent} onChange={(e) => updateForm({ targetOffsetPercent: e.target.value })} /></Field>
      ) : null}
      <Field label="ظرفیت واحد باتری (Ah)">{form.systemType === "backup" ? (
        <select value={form.batteryUnitAh} onChange={(e) => updateForm({ batteryUnitAh: e.target.value })}>{BACKUP_BATTERY_CAPACITY_OPTIONS.map((v) => <option key={v} value={v}>{v}Ah</option>)}</select>
      ) : (
        <input type="number" value={form.batteryUnitAh} onChange={(e) => updateForm({ batteryUnitAh: e.target.value })} />
      )}</Field>
      <Field label="ولتاژ واحد باتری (V)">{form.systemType === "backup" ? (
        <select value={form.batteryUnitVoltage} onChange={(e) => updateForm({ batteryUnitVoltage: e.target.value })}>{availableBatteryVoltages.map((v) => <option key={v} value={v}>{v}V</option>)}</select>
      ) : (
        <input type="number" value={form.batteryUnitVoltage} onChange={(e) => updateForm({ batteryUnitVoltage: e.target.value })} />
      )}</Field>
      <Field label="روزهای خودمختاری"><input type="number" step="0.1" value={form.daysAutonomy} onChange={(e) => updateForm({ daysAutonomy: e.target.value })} /></Field>
      <Field label="عمق دشارژ DoD"><input type="number" step="0.01" value={form.dod} onChange={(e) => updateForm({ dod: e.target.value })} /></Field>
      <Field label="راندمان اینورتر"><input type="number" step="0.01" value={form.inverterEfficiency} onChange={(e) => updateForm({ inverterEfficiency: e.target.value })} /></Field>
      {form.systemType !== "backup" ? <Field label="راندمان کنترلر"><input type="number" step="0.01" value={form.controllerEfficiency} onChange={(e) => updateForm({ controllerEfficiency: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="توان پنل (W)"><input type="number" value={form.panelWatt} onChange={(e) => updateForm({ panelWatt: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="نوع پنل">
        <select value={form.panelType} onChange={(e) => updateForm({ panelType: e.target.value })}>{PANEL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
      </Field> : null}
      {form.systemType !== "backup" ? <Field label="Voc پنل"><input type="number" step="0.1" value={form.panelVoc} onChange={(e) => updateForm({ panelVoc: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="Vmp پنل"><input type="number" step="0.1" value={form.panelVmp} onChange={(e) => updateForm({ panelVmp: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداکثر Voc کنترلر"><input type="number" value={form.controllerMaxVoc} onChange={(e) => updateForm({ controllerMaxVoc: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداقل MPPT"><input type="number" value={form.mpptMinVoltage} onChange={(e) => updateForm({ mpptMinVoltage: e.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="حداکثر MPPT"><input type="number" value={form.mpptMaxVoltage} onChange={(e) => updateForm({ mpptMaxVoltage: e.target.value })} /></Field> : null}
      <Field label="ضریب طراحی"><input type="number" step="0.01" value={form.designFactor} onChange={(e) => updateForm({ designFactor: e.target.value })} /></Field>
        <Field label="ضریب Surge پیش‌فرض"><input type="number" step="0.1" value={form.surgeFactor} onChange={(e) => updateForm({ surgeFactor: e.target.value })} /></Field>
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
      <div><span>تجهیزات انتخاب‌شده</span><strong>{[form.systemType !== "backup" ? form.selectedEquipment?.panel : null, form.selectedEquipment?.battery, form.selectedEquipment?.inverter, form.systemType !== "backup" ? form.selectedEquipment?.controller : null].filter(Boolean).length} مورد</strong></div>
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
  const { stepIndex, nextStep, prevStep, runCalculation, saveProject, goDashboard } = useProjectStore();
  const CurrentStep = stepMap[stepIndex].component;

  return (
    <div className="shell">
      <header className="topbar topbar--workspace" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.92), rgba(15,23,42,0.82)), url(${PUBLIC_ASSETS.backgrounds.workspace})` }}>
        <button className="btn btn--ghost" onClick={goDashboard}>بازگشت به داشبورد</button>
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
