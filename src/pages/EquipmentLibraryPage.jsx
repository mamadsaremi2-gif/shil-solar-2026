import { useMemo, useState } from 'react';
import { useProjectStore } from '../app/store/projectStore';
import { EquipmentRepository } from '../data/repositories/EquipmentRepository';
import { parseFaNumber } from '../shared/utils/faNumbers';

const CUSTOM_SPEC_FIELDS = {
  panel: [
    ['panelWatt', 'توان پنل (W)'],
    ['panelVoc', 'Voc پنل'],
    ['panelVmp', 'Vmp پنل'],
    ['panelTempCoeffVoc', 'ضریب دمایی Voc'],
  ],
  battery: [
    ['batteryType', 'نوع باتری'],
    ['batteryUnitVoltage', 'ولتاژ واحد باتری'],
    ['batteryUnitAh', 'ظرفیت واحد باتری (Ah)'],
    ['batteryRoundTripEfficiency', 'راندمان چرخه'],
    ['dod', 'عمق دشارژ مجاز'],
  ],
  inverter: [
    ['systemVoltage', 'ولتاژ سیستم'],
    ['ratedPowerW', 'توان نامی (W)'],
    ['surgePowerW', 'توان لحظه ای (W)'],
    ['inverterEfficiency', 'راندمان اینورتر'],
  ],
  load: [
    ['name', 'نام مصرف‌کننده'],
    ['qty', 'تعداد پیش‌فرض'],
    ['power', 'توان هر عدد (W)'],
    ['hours', 'ساعت کار روزانه'],
    ['powerFactor', 'ضریب توان PF'],
    ['coincidenceFactor', 'ضریب همزمانی'],
    ['loadType', 'نوع بار'],
    ['surgeFactor', 'ضریب راه‌اندازی'],
  ],
};

function getInitialDraft(category) {
  const specEntries = Object.fromEntries((CUSTOM_SPEC_FIELDS[category] || []).map(([key]) => [key, '']));
  return {
    id: null,
    title: '',
    brand: '',
    model: '',
    summary: '',
    specs: specEntries,
  };
}

function prettySpecValue(value) {
  return typeof value === 'number' ? String(value) : String(value ?? '');
}

export function EquipmentLibraryPage() {
  const { goBackFromEquipment } = useProjectStore();
  const [category, setCategory] = useState('panel');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(() => getInitialDraft('panel'));
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState('');
  const categories = EquipmentRepository.categories();
  const items = useMemo(() => EquipmentRepository.search({ category, query }), [category, query, refreshKey]);
  const customItems = useMemo(() => EquipmentRepository.listCustom(category), [category, refreshKey]);
  const isEditing = Boolean(draft.id);

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
    setDraft(getInitialDraft(nextCategory));
    setMessage('');
  }

  function updateDraftField(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateSpecField(field, value) {
    setDraft((prev) => ({ ...prev, specs: { ...prev.specs, [field]: value } }));
  }

  function normalizeSpecs() {
    return Object.fromEntries(
      Object.entries(draft.specs).map(([key, value]) => {
        const trimmed = String(value ?? '').trim();
        const num = parseFaNumber(trimmed, NaN);
        return [key, trimmed !== '' && Number.isFinite(num) ? num : trimmed];
      })
    );
  }

  function loadDraftFromItem(item) {
    const next = getInitialDraft(item.category);
    const mergedSpecs = { ...next.specs };
    Object.entries(item.specs || {}).forEach(([key, value]) => {
      mergedSpecs[key] = value == null ? '' : String(value);
    });

    setCategory(item.category);
    setDraft({
      id: item.id,
      title: item.title || '',
      brand: item.brand || '',
      model: item.model || '',
      summary: item.summary || '',
      specs: mergedSpecs,
    });
    setMessage(`تجهیز «${item.title}» برای ویرایش بارگذاری شد.`);
  }

  function resetDraft() {
    setDraft(getInitialDraft(category));
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      const payload = {
        id: draft.id,
        category,
        title: draft.title,
        brand: draft.brand,
        model: draft.model,
        summary: draft.summary,
        specs: normalizeSpecs(),
      };

      if (isEditing) {
        EquipmentRepository.updateCustomEquipment(payload);
        setMessage('تجهیز سفارشی با موفقیت ویرایش شد.');
      } else {
        EquipmentRepository.addCustomEquipment(payload);
        setMessage('تجهیز سفارشی با موفقیت ذخیره شد.');
      }

      resetDraft();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setMessage(error.message || 'ذخیره تجهیز سفارشی انجام نشد.');
    }
  }

  function handleRemove(item) {
    EquipmentRepository.removeCustomEquipment(item.id);
    if (draft.id === item.id) {
      resetDraft();
    }
    setRefreshKey((prev) => prev + 1);
    setMessage(`تجهیز «${item.title}» حذف شد.`);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button className="btn btn--ghost" onClick={goBackFromEquipment}>بازگشت</button>
        <div className="topbar__title">بانک تجهیزات Solar Design Suite</div>
      </header>

      <section className="panel stack-lg">
        <div className="panel__header">
          <h2>کتابخانه تجهیزات فنی</h2>
          <span className="badge">{items.length} تجهیز</span>
        </div>

        <div className="equipment-toolbar">
          <div className="chip-row">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${category === item.id ? 'is-active' : ''}`}
                onClick={() => handleCategoryChange(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            placeholder="جستجو بر اساس برند، مدل یا عنوان..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="equipment-library-layout">
          <div className="equipment-grid">
            {items.map((item) => (
              <article key={item.id} className="equipment-card">
                <div className="equipment-card__head">
                  <strong>{item.title}</strong>
                  <span>{item.brand} / {item.model}</span>
                </div>
                <p>{item.summary}</p>
                {item.isCustom ? <span className="badge badge--subtle">سفارشی</span> : null}
                <div className="equipment-specs">
                  {Object.entries(item.specs).slice(0, 6).map(([key, value]) => (
                    <div key={key}><span>{key}</span><strong>{prettySpecValue(value)}</strong></div>
                  ))}
                </div>
                {item.isCustom ? (
                  <div className="equipment-card__actions">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadDraftFromItem(item)}>
                      ویرایش تجهیز
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleRemove(item)}>
                      حذف تجهیز سفارشی
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="panel panel--soft stack-md equipment-custom-panel">
            <div className="panel__header compact">
              <h3>{isEditing ? 'ویرایش تجهیز سفارشی' : 'افزودن تجهیز سفارشی'}</h3>
              <span className="badge badge--subtle">{customItems.length} مورد سفارشی</span>
            </div>
            {message ? <div className="inline-note">{message}</div> : null}
            <form className="stack-md" onSubmit={handleSubmit}>
              <input className="search-input" placeholder="عنوان تجهیز" value={draft.title} onChange={(e) => updateDraftField('title', e.target.value)} />
              <div className="form-grid two-cols compact-grid">
                <input className="search-input" placeholder="برند" value={draft.brand} onChange={(e) => updateDraftField('brand', e.target.value)} />
                <input className="search-input" placeholder="مدل" value={draft.model} onChange={(e) => updateDraftField('model', e.target.value)} />
              </div>
              <textarea className="search-input search-input--textarea" placeholder="خلاصه یا توضیح کوتاه" value={draft.summary} onChange={(e) => updateDraftField('summary', e.target.value)} />
              <div className="form-grid two-cols compact-grid">
                {(CUSTOM_SPEC_FIELDS[category] || []).map(([field, label]) => (
                  <label key={field} className="stack-xs equipment-spec-field">
                    <span>{label}</span>
                    <input className="search-input" value={draft.specs[field] ?? ''} onChange={(e) => updateSpecField(field, e.target.value)} />
                  </label>
                ))}
              </div>
              <div className="equipment-custom-panel__actions">
                <button type="submit" className="btn btn--secondary">{isEditing ? 'ذخیره تغییرات' : 'ذخیره تجهیز سفارشی'}</button>
                {isEditing ? (
                  <button type="button" className="btn btn--ghost" onClick={resetDraft}>انصراف از ویرایش</button>
                ) : null}
              </div>
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}
