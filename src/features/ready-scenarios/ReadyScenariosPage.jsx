import { useMemo, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { BACKUP_PROJECT_PRESETS, SOLAR_PROJECT_PRESETS } from "../../data/seed/smartProjectPresets";
import { PUBLIC_ASSETS } from "../../shared/constants/publicAssets";

const FAMILY_CARDS = [
  {
    value: "solar",
    title: "سناریوهای آماده انرژی خورشیدی",
    subtitle: "۳۰۰ سناریوی دارای پنل خورشیدی، باتری، اینورتر و خودکفایی",
    icon: "☀️",
    range: "۱۰۰ سبک · ۱۰۰ متوسط · ۱۰۰ سنگین",
  },
  {
    value: "backup",
    title: "سناریوهای آماده برق اضطراری",
    subtitle: "۳۰۰ سناریوی بدون پنل؛ فقط UPS/سانورتر، باتری و ساعت بکاپ",
    icon: "🔋",
    range: "۱۰۰ سبک · ۱۰۰ متوسط · ۱۰۰ سنگین",
  },
];

const CATEGORY_CARDS = [
  {
    value: "light",
    title: "پروژه‌های سبک",
    subtitle: "آپارتمان، واحد کوچک، بارهای ضروری و فروشگاه‌های کم‌مصرف",
    icon: "🏠",
    range: "۱۰۰ سناریو",
  },
  {
    value: "medium",
    title: "پروژه‌های متوسط",
    subtitle: "ویلا، دفتر، باغ، رستوران، کارگاه و پروژه‌های نیمه‌صنعتی",
    icon: "🏢",
    range: "۱۰۰ سناریو",
  },
  {
    value: "heavy",
    title: "پروژه‌های سنگین",
    subtitle: "صنعتی، تجاری بزرگ، دیتاسنتر، بیمارستان و پروژه‌های حیاتی",
    icon: "🏭",
    range: "۱۰۰ سناریو",
  },
];

function scenarioSize(preset) {
  if (preset.scenarioSize) return preset.scenarioSize;
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

function familyLabel(family) {
  return family === "backup" ? "برق اضطراری" : "انرژی خورشیدی";
}

function familyPresets(family) {
  return family === "backup" ? BACKUP_PROJECT_PRESETS : SOLAR_PROJECT_PRESETS;
}

export function ReadyScenariosPage() {
  const { goBackFromScenarios, startProjectFromScenario } = useProjectStore();
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState("");

  const scenarios = useMemo(() => {
    if (!selectedFamily || !selectedCategory) return [];
    const customScenarios = selectedFamily === "solar"
      ? JSON.parse(localStorage.getItem("shil_custom_scenarios") || "[]").map((item) => ({
          ...item,
          scenarioFamily: item.scenarioFamily || "solar",
          category: "مدیریتی",
          bestFor: "سناریوی منتقل‌شده از پروژه محاسبه‌شده",
          package: item.package || {},
          tags: ["مدیریتی", "ذخیره‌شده"],
        }))
      : [];

    const q = query.trim();
    return [...customScenarios, ...familyPresets(selectedFamily)]
      .filter((preset) => scenarioSize(preset) === selectedCategory)
      .filter((preset) => {
        if (!q) return true;
        const text = `${preset.title} ${preset.category} ${preset.bestFor} ${preset.summary} ${(preset.tags || []).join(" ")} ${preset.package?.panel || ""} ${preset.package?.battery || ""} ${preset.package?.inverter || ""}`;
        return text.includes(q);
      });
  }, [selectedFamily, selectedCategory, query]);

  function resetFamily() {
    setSelectedFamily(null);
    setSelectedCategory(null);
    setQuery("");
  }

  function resetCategory() {
    setSelectedCategory(null);
    setQuery("");
  }

  return (
    <div className="shell ready-scenarios-shell ready-scenarios-flow" dir="rtl">
      <header className="scenario-flow-header">
        <button className="btn btn--ghost" type="button" onClick={selectedFamily ? resetFamily : goBackFromScenarios}>بازگشت</button>
        <div className="scenario-flow-header__brand">
          <img src={PUBLIC_ASSETS.branding.appLogo} alt="SHIL" />
          <div>
            <span>سناریوهای آماده</span>
            <strong>انتخاب سریع، سپس تنظیم شهر و لیست تجهیزات</strong>
          </div>
        </div>
      </header>

      {!selectedFamily ? (
        <section className="scenario-stage-card">
          <div className="scenario-stage-title">
            <span>مرحله ۱</span>
            <h1>سناریوهای آماده</h1>
            <p>ابتدا نوع پکیج آماده را انتخاب کنید؛ سناریوهای خورشیدی دارای پنل هستند و سناریوهای برق اضطراری کاملاً بدون پنل طراحی شده‌اند.</p>
          </div>

          <div className="scenario-category-grid scenario-category-grid--families">
            {FAMILY_CARDS.map((family) => (
              <button key={family.value} type="button" className="scenario-category-card scenario-category-card--family" onClick={() => setSelectedFamily(family.value)}>
                <span className="scenario-category-card__icon">{family.icon}</span>
                <strong>{family.title}</strong>
                <small>{family.subtitle}</small>
                <em>{family.range}</em>
              </button>
            ))}
          </div>
        </section>
      ) : !selectedCategory ? (
        <section className="scenario-stage-card">
          <div className="scenario-stage-title scenario-stage-title--row">
            <div>
              <span>مرحله ۲</span>
              <h1>{familyLabel(selectedFamily)} را بر اساس ظرفیت انتخاب کنید</h1>
              <p>{selectedFamily === "backup" ? "در برق اضطراری، محاسبه فقط با توان مصرف‌کننده و ساعت بکاپ انجام می‌شود؛ پنل، تابش، زمان مصرف روزانه، فصل کارکرد و ضریب فصل وارد محاسبه نمی‌شوند." : "در سناریوهای خورشیدی، پنل، باتری، اینورتر، روزهای خودکفایی و شرایط اقلیمی در طراحی اثر دارند."}</p>
            </div>
            <button className="btn btn--ghost" type="button" onClick={resetFamily}>تغییر نوع سناریو</button>
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
              <span>مرحله ۳</span>
              <h1>{familyLabel(selectedFamily)} · پروژه‌های {sizeLabel(selectedCategory)}</h1>
              <p>{selectedFamily === "backup" ? "این لیست شامل سناریوهای بدون پنل است. ساعت بکاپ در باتری و اینورتر اثر دارد، اما زمان مصرف روزانه و فصل کارکرد در برق اضطراری حذف شده‌اند." : "سناریوی موردنظر را انتخاب کنید؛ اپ وارد مرحله شرایط محیطی می‌شود و همه تجهیزات در ادامه قابل ویرایش هستند."}</p>
            </div>
            <button className="btn btn--ghost" type="button" onClick={resetCategory}>تغییر ظرفیت</button>
          </div>

          <div className="scenario-compact-toolbar">
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در همین دسته: ویلا، دفتر، پمپ، سرور، بیمارستان..."
            />
            <span className="badge">{scenarios.length} سناریو</span>
          </div>

          <div className="scenario-compact-list">
            {scenarios.map((preset) => (
              <button key={preset.id} type="button" className="scenario-compact-item" onClick={() => startProjectFromScenario(preset)}>
                <div>
                  <span>{familyLabel(selectedFamily)} · {systemLabel(preset.systemType)} · {sizeLabel(scenarioSize(preset))}</span>
                  <strong>{preset.title}</strong>
                  <small>{preset.bestFor}</small>
                </div>
                <div className="scenario-compact-item__metrics">
                  {selectedFamily === "backup" ? (
                    <>
                      <b>{preset.package?.backupHours ?? preset.patch?.backupHours} ساعت بکاپ</b>
                      <small>{preset.package?.panel || "بدون پنل خورشیدی"}</small>
                    </>
                  ) : (
                    <>
                      <b>{preset.package?.dailyEnergyKwh ?? preset.patch?.dailyEnergyKwh} kWh/day</b>
                      <small>{preset.package?.autonomyDays ?? preset.patch?.daysAutonomy ?? 0} روز خودکفایی</small>
                    </>
                  )}
                  <i>{selectedFamily === "backup" ? "تنظیم برق اضطراری" : "تنظیم شرایط محیطی"}</i>
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
