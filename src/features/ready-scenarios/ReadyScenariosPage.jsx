import { useMemo, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { SMART_PROJECT_PRESETS } from "../../data/seed/smartProjectPresets";
import { PUBLIC_ASSETS } from "../../shared/constants/publicAssets";

const CATEGORY_CARDS = [
  {
    value: "light",
    title: "پروژه‌های سبک",
    subtitle: "آپارتمان، واحد کوچک، بارهای ضروری",
    icon: "🏠",
    range: "تا 12 kWh/day",
  },
  {
    value: "medium",
    title: "پروژه‌های متوسط",
    subtitle: "ویلا، دفتر، باغ و مصرف روزانه متعادل",
    icon: "🏢",
    range: "12 تا 35 kWh/day",
  },
  {
    value: "heavy",
    title: "پروژه‌های سنگین",
    subtitle: "مصرف بالا، بار سرمایشی یا پروژه‌های بزرگ‌تر",
    icon: "🏭",
    range: "بیش از 35 kWh/day",
  },
];

function scenarioSize(preset) {
  const energy = Number(preset.package?.dailyEnergyKwh ?? preset.patch?.dailyEnergyKwh ?? 0);
  if (energy <= 12) return "light";
  if (energy <= 35) return "medium";
  return "heavy";
}

function systemLabel(type) {
  return type === "hybrid" ? "هیبرید" : type === "offgrid" ? "آفگرید" : type === "gridtie" ? "آنگرید" : "برق اضطراری";
}

function sizeLabel(size) {
  if (size === "light") return "سبک";
  if (size === "medium") return "متوسط";
  return "سنگین";
}

export function ReadyScenariosPage() {
  const { goBackFromScenarios, startProjectFromScenario } = useProjectStore();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState("");

  const scenarios = useMemo(() => {
    const customScenarios = JSON.parse(localStorage.getItem("shil_custom_scenarios") || "[]").map((item) => ({
      ...item,
      category: "مدیریتی",
      bestFor: "سناریوی منتقل‌شده از پروژه محاسبه‌شده",
      package: item.package || {},
      tags: ["مدیریتی", "ذخیره‌شده"],
    }));

    const q = query.trim();
    return [...customScenarios, ...SMART_PROJECT_PRESETS]
      .filter((preset) => !selectedCategory || scenarioSize(preset) === selectedCategory)
      .filter((preset) => {
        if (!q) return true;
        const text = `${preset.title} ${preset.category} ${preset.bestFor} ${preset.summary} ${(preset.tags || []).join(" ")} ${preset.package?.panel || ""} ${preset.package?.battery || ""} ${preset.package?.inverter || ""}`;
        return text.includes(q);
      });
  }, [selectedCategory, query]);

  return (
    <div className="shell ready-scenarios-shell ready-scenarios-flow" dir="rtl">
      <header className="scenario-flow-header">
        <button className="btn btn--ghost" type="button" onClick={goBackFromScenarios}>بازگشت</button>
        <div className="scenario-flow-header__brand">
          <img src={PUBLIC_ASSETS.branding.appLogo} alt="SHIL" />
          <div>
            <span>سناریوهای آماده</span>
            <strong>انتخاب سریع، سپس تنظیم شهر و لیست تجهیزات</strong>
          </div>
        </div>
      </header>

      {!selectedCategory ? (
        <section className="scenario-stage-card">
          <div className="scenario-stage-title">
            <span>مرحله ۱</span>
            <h1>نوع سناریوی آماده را انتخاب کنید</h1>
            <p>برای جلوگیری از شلوغی، ابتدا فقط دسته سناریو مشخص می‌شود؛ بعد از انتخاب، پکیج‌های همان دسته نمایش داده می‌شوند.</p>
          </div>

          <div className="scenario-category-grid">
            {CATEGORY_CARDS.map((category) => (
              <button key={category.value} type="button" className="scenario-category-card" onClick={() => setSelectedCategory(category.value)}>
                <span className="scenario-category-card__icon">{category.icon}</span>
                <strong>{category.title}</strong>
                <small>{category.subtitle}</small>
                <em>{category.range}</em>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="scenario-stage-card">
          <div className="scenario-stage-title scenario-stage-title--row">
            <div>
              <span>مرحله ۲</span>
              <h1>{sizeLabel(selectedCategory)}‌ها</h1>
              <p>سناریوی موردنظر را انتخاب کنید؛ اپ مستقیماً وارد مرحله شرایط محیطی می‌شود و بعد تجهیزات همان سناریو در مسیر فلو قابل ویرایش هستند.</p>
            </div>
            <button className="btn btn--ghost" type="button" onClick={() => setSelectedCategory(null)}>تغییر دسته</button>
          </div>

          <div className="scenario-compact-toolbar">
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در همین دسته: ویلا، دفتر، باغ، ۱۵۰ متر..."
            />
            <span className="badge">{scenarios.length} سناریو</span>
          </div>

          <div className="scenario-compact-list">
            {scenarios.map((preset) => (
              <button key={preset.id} type="button" className="scenario-compact-item" onClick={() => startProjectFromScenario(preset)}>
                <div>
                  <span>{systemLabel(preset.systemType)} · {sizeLabel(scenarioSize(preset))}</span>
                  <strong>{preset.title}</strong>
                  <small>{preset.bestFor}</small>
                </div>
                <div className="scenario-compact-item__metrics">
                  <b>{preset.package?.dailyEnergyKwh ?? preset.patch?.dailyEnergyKwh} kWh/day</b>
                  <i>تنظیم شرایط محیطی</i>
                </div>
              </button>
            ))}
          </div>

          {!scenarios.length ? <div className="panel empty-state">سناریویی با این جستجو پیدا نشد.</div> : null}
        </section>
      )}
    </div>
  );
}
