import { useMemo, useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
import { SMART_PROJECT_PRESETS } from "../data/seed/smartProjectPresets";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";

const SYSTEM_FILTERS = [
  { value: "all", label: "همه پکیج‌ها" },
  { value: "offgrid", label: "آفگرید" },
  { value: "hybrid", label: "هیبرید" },
  { value: "apartment", label: "آپارتمان" },
  { value: "villa", label: "ویلا" },
  { value: "garden", label: "باغ" },
  { value: "office", label: "دفتر اداری" },
];

function matchesFilter(preset, filter) {
  if (filter === "all") return true;
  if (filter === "offgrid" || filter === "hybrid") return preset.systemType === filter;

  const text = `${preset.category} ${preset.title} ${(preset.tags || []).join(" ")}`;
  const map = {
    apartment: "آپارتمان",
    villa: "ویلا",
    garden: "باغ",
    office: "دفتر",
  };

  return text.includes(map[filter]);
}

function systemLabel(type) {
  if (type === "hybrid") return "هیبرید";
  if (type === "offgrid") return "آفگرید";
  return type || "نامشخص";
}

function PackageDetail({ label, value }) {
  return (
    <div className="ready-scenario-detail">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export function ReadyScenariosPage() {
  const { goBackFromScenarios, startProjectFromScenario } = useProjectStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const scenarios = useMemo(() => {
    const q = query.trim();

    return SMART_PROJECT_PRESETS
      .filter((preset) => matchesFilter(preset, filter))
      .filter((preset) => {
        if (!q) return true;

        const text = `
          ${preset.title}
          ${preset.category}
          ${preset.bestFor}
          ${preset.summary}
          ${(preset.tags || []).join(" ")}
          ${preset.package?.panel || ""}
          ${preset.package?.battery || ""}
          ${preset.package?.inverter || ""}
        `;

        return text.includes(q);
      });
  }, [filter, query]);

  return (
    <div className="shell ready-scenarios-shell">
      <header
        className="topbar topbar--workspace ready-scenarios-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.88), rgba(15,23,42,0.72)), url(${PUBLIC_ASSETS.backgrounds.workspace})`,
        }}
      >
        <button className="btn btn--ghost" type="button" onClick={goBackFromScenarios}>
          بازگشت
        </button>

        <div className="topbar__title topbar__title--brand">
          <img src={PUBLIC_ASSETS.branding.appLogo} alt="SHIL" className="topbar__brand-logo" />
          <span>سناریوهای آماده SHIL SOLAR</span>
        </div>
      </header>

      <section className="panel ready-scenarios-intro">
        <div>
          <span className="eyebrow">Ready Solar Packages</span>
          <h1>پکیج‌های آماده آپارتمان، ویلا، باغ و دفتر اداری</h1>
          <p className="section-note">
            هر پکیج بر اساس میانگین مصرف واقعی و تجهیزات موجود در بانک SHIL ساخته شده است. با انتخاب پکیج،
            فرم پروژه به صورت خودکار تکمیل می‌شود و می‌توانید قبل از محاسبه نهایی مقادیر را ویرایش کنید.
          </p>
        </div>

        <span className="badge">{SMART_PROJECT_PRESETS.length} پکیج آماده</span>
      </section>

      <section className="panel ready-scenarios-toolbar">
        <div className="scenario-filter-tabs">
          {SYSTEM_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "is-active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو: ویلا، دفتر، باغ، ۱۵۰ متر، SHIL-700W..."
        />
      </section>

      <section className="ready-scenario-grid">
        {scenarios.map((preset) => {
          const dailyEnergy = preset.package?.dailyEnergyKwh ?? preset.patch?.dailyEnergyKwh;
          const systemType = systemLabel(preset.systemType);

          return (
            <article key={preset.id} className="panel ready-scenario-card">
              <div className="ready-scenario-card__title-row">
                <h2>{preset.title}</h2>
                <span className="ready-scenario-card__type">{systemType}</span>
              </div>

              <p className="ready-scenario-card__description">{preset.bestFor}</p>

              <div className="ready-scenario-details">
                <PackageDetail label="مصرف روزانه" value={`${dailyEnergy || "—"} kWh/day`} />
                <PackageDetail label="نوع سیستم" value={systemType} />
                <PackageDetail label="دسته‌بندی" value={preset.category} />
                <PackageDetail label="کاربری پیشنهادی" value={preset.bestFor} />
              </div>

              <div className="scenario-package-grid">
                <PackageDetail label="پنل پیشنهادی" value={preset.package?.panel} />
                <PackageDetail label="باتری پیشنهادی" value={preset.package?.battery} />
                <PackageDetail label="اینورتر پیشنهادی" value={preset.package?.inverter} />
                <PackageDetail label="توان تقریبی آرایه" value={preset.package?.expectedPvKw ? `${preset.package.expectedPvKw} kW` : "—"} />
              </div>

              <p className="scenario-note">{preset.package?.note || preset.summary}</p>

              <div className="smart-preset-tags">
                {(preset.tags || []).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <button className="btn btn--primary" type="button" onClick={() => startProjectFromScenario(preset)}>
                استفاده از این پکیج و شروع طراحی
              </button>
            </article>
          );
        })}
      </section>

      {!scenarios.length ? <div className="panel empty-state">سناریویی با این فیلتر پیدا نشد.</div> : null}
    </div>
  );
}