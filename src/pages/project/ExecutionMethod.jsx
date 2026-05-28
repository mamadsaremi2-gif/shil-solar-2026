import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

const EXECUTION_OPTIONS = [
  {
    key: "solar",
    title: "اجرای پروژه با پنل خورشیدی",
    subtitle: "طراحی سیستم خورشیدی با پنل، باتری، اینورتر و حفاظت",
    image: "/assets/shil/execution/solar-execution.png",
    next: "/new-project/system/solar",
    engineLabel: "Solar Engineering Core",
  },
  {
    key: "emergency",
    title: "اجرای پروژه با برق اضطراری",
    subtitle: "طراحی سیستم پشتیبان با اینورتر و باتری",
    image: "/assets/shil/execution/emergency-inverter-battery.png",
    next: "/new-project/system/emergency",
    engineLabel: "Emergency Battery Inverter Core",
  },
];

export default function ExecutionMethod() {
  const navigate = useNavigate();
  const params = useParams();
  const preferredDomain = params.domain || localStorage.getItem("shil:calculationDomain") || localStorage.getItem("shil:scenarioDomain") || "solar";
  const [selected, setSelected] = React.useState(preferredDomain === "emergency" ? "emergency" : "solar");
  const [warning, setWarning] = React.useState("");

  const load = React.useMemo(() => readDraft("shil:loadEngineResult"), []);
  const environment = React.useMemo(() => readDraft("shil:environmentDraft"), []);
  const selectedOption = EXECUTION_OPTIONS.find((item) => item.key === selected);

  const confirm = () => {
    if (!selectedOption) {
      setWarning("لطفاً روش اجرای پروژه را انتخاب کنید.");
      return;
    }

    approveProjectStep("execution");
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", selectedOption.key);
    localStorage.setItem("shil:executionMethodDraft", JSON.stringify({
      method: selectedOption.key,
      label: selectedOption.title,
      description: selectedOption.subtitle,
      engineLabel: selectedOption.engineLabel,
      source: "execution-method-gateway",
      confirmedAt: new Date().toISOString(),
    }));
    navigate(`${selectedOption.next}?from=execution-method`);
  };

  return (
    <EngineeringPageShell title="نوع اجرای پروژه">
      <section className="shil-card-stack shil-execution-method-page">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>روش اجرای پروژه را انتخاب کنید</h2>
            <span>Decision Gateway</span>
          </div>

          <div className="shil-summary-grid">
            <div><span>شهر</span><strong>{environment?.city || "اصفهان"}</strong></div>
            <div><span>توان مرجع</span><strong>{load?.totalPowerW ? `${load.totalPowerW} W` : "در انتظار محاسبه"}</strong></div>
            <div><span>انرژی روزانه</span><strong>{load?.totalEnergyKWh ? `${load.totalEnergyKWh} kWh` : "در انتظار محاسبه"}</strong></div>
            <div><span>مرحله بعد</span><strong>طراحی سیستم انتخاب‌شده</strong></div>
          </div>

          <div className="shil-execution-grid">
            {EXECUTION_OPTIONS.map((option) => {
              const active = selected === option.key;
              return (
                <button
                  type="button"
                  key={option.key}
                  className={`shil-execution-card ${active ? "active" : ""}`}
                  onClick={() => { setSelected(option.key); setWarning(""); }}
                  aria-pressed={active}
                >
                  <img src={option.image} alt="" className="shil-execution-image" />
                  <span className="shil-execution-check">{active ? "✓" : ""}</span>
                  <h3>{option.title}</h3>
                  <p>{option.subtitle}</p>
                  <small>{option.key === "emergency" ? "نام نمایشی کاربر: برق اضطراری با اینورتر و باتری" : "مناسب برای آفگرید، هیبرید و آنگرید"}</small>
                </button>
              );
            })}
          </div>

          {warning ? <div className="shil-inline-warning">{warning}</div> : null}

          <button type="button" className="shil-primary-wide" onClick={confirm} disabled={!selectedOption}>
            تأیید مرحله و ادامه
          </button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
