import { useMemo, useState } from "react";
import { MobileShell } from "../shared/components/MobileShell.jsx";
import { MobileHeader } from "../shared/components/MobileHeader.jsx";
import { MobileFooter } from "../shared/components/MobileFooter.jsx";
import { AppCard } from "../shared/components/AppCard.jsx";
import { AppInput } from "../shared/components/AppInput.jsx";
import { AppSelect } from "../shared/components/AppSelect.jsx";
import { NEW_PROJECT_STEPS } from "../modules/new-project/newProject.steps.js";
import { PROJECT_PATH_OPTIONS, SOLAR_MODE_OPTIONS } from "../modules/new-project/steps/03-project-path/projectPath.options.js";
import { CALCULATION_METHODS } from "../modules/new-project/steps/04-calculation-method/calculationMethods.config.js";

const dashboardItems = [
  { id: "new", title: "پروژه جدید", icon: "＋", note: "مسیر ۹ مرحله‌ای" },
  { id: "projects", title: "پروژه‌ها", icon: "▦", note: "جاری و نهایی" },
  { id: "ready", title: "سناریوهای آماده", icon: "⚡", note: "خورشیدی و اضطراری" },
  { id: "assistant", title: "دستیار هوشمند", icon: "AI", note: "کنترل مهندسی" },
  { id: "feedback", title: "بازخورد کاربر", icon: "◎", note: "ثبت مشکل/پیشنهاد" },
  { id: "contact", title: "ارتباط با ما", icon: "☎", note: "راه‌های تماس" }
];

const initialForm = {
  projectName: "نیروگاه خورشیدی نمونه",
  employer: "کارفرمای پروژه",
  city: "تهران",
  installType: "roof",
  sunHours: "5.2",
  ambientTemp: "38",
  altitude: "1190",
  path: "solar-panel",
  solarMode: "offgrid",
  method: "loads",
  dailyEnergy: "18",
  peakPower: "6",
  backupHours: "8",
  systemVoltage: "48",
  autonomy: "1.5",
  note: "داده‌ها قابل Override دستی هستند و قبل از محاسبه نرمال می‌شوند."
};

const titles = {
  dashboard: "داشبورد",
  projects: "پروژه‌ها",
  ready: "سناریوهای آماده",
  assistant: "دستیار هوشمند",
  feedback: "بازخورد کاربر",
  contact: "ارتباط با ما",
  new: "پروژه جدید"
};

function Panel({ title, meta, children }) {
  return <section className="shil-panel"><div className="shil-panel-title"><h2>{title}</h2>{meta ? <span>{meta}</span> : null}</div>{children}</section>;
}

function StepStrip({ step }) {
  return <div className="shil-path-strip" aria-label="مسیر طراحی پروژه">{NEW_PROJECT_STEPS.map((item, index) => <div key={item.id} className={`shil-step-chip ${index === step ? "active" : ""}`}><b>{item.number}</b><span>{item.title}</span></div>)}</div>;
}

function Dashboard({ go }) {
  return <>
    <Panel title="SHIL Mobile V15" meta="Industrial UI">
      <div className="shil-hero"><h1>طراحی هوشمند سامانه‌های خورشیدی و برق اضطراری</h1><p>رابط واقعی موبایل‌فرست، فشرده، بدون اسکرول افقی سراسری و آماده اتصال به موتور محاسبات.</p></div>
    </Panel>
    <Panel title="دسترسی سریع" meta="۳×۲">
      <div className="shil-grid cols-2">{dashboardItems.map((item) => <AppCard key={item.id} icon={item.icon} title={item.title} note={item.note} onClick={() => go(item.id)} />)}</div>
    </Panel>
    <Panel title="وضعیت زیرساخت" meta="V15">
      <div className="shil-metrics"><div className="shil-metric"><b>UI</b><span>پیاده‌سازی واقعی</span></div><div className="shil-metric"><b>RTL</b><span>فارسی / انگلیسی</span></div><div className="shil-metric"><b>0</b><span>اسکرول افقی سراسری</span></div><div className="shil-metric"><b>Ready</b><span>اتصال به Engine</span></div></div>
    </Panel>
  </>;
}

function Projects() {
  return <>
    <Panel title="پروژه‌های در حال اجرا" meta="Auto Save">
      <div className="shil-grid"><AppCard icon="◌" title="نیروگاه خورشیدی نمونه" note="مرحله: انتخاب مسیر پروژه / ذخیره پیش‌نویس فعال" active /></div>
    </Panel>
    <Panel title="پروژه‌های نهایی" meta="Completed">
      <div className="shil-grid"><AppCard icon="✓" title="سامانه اضطراری اداری" note="خروجی مهندسی بدون اطلاعات مالی" /></div>
    </Panel>
  </>;
}

function ReadyScenarios({ setForm, setPage }) {
  const pick = (path, mode) => { setForm((f) => ({ ...f, path, solarMode: mode || f.solarMode, projectName: path === "backup" ? "سناریوی آماده برق اضطراری" : "سناریوی آماده خورشیدی" })); setPage("new"); };
  return <>
    <Panel title="سناریوهای آماده انرژی خورشیدی" meta="سبک / متوسط / سنگین">
      <div className="shil-grid cols-3"><AppCard icon="☼" title="سبک" note="مصرف کم" onClick={() => pick("solar-panel", "offgrid")} /><AppCard icon="☀" title="متوسط" note="هیبرید" onClick={() => pick("solar-panel", "hybrid")} /><AppCard icon="▣" title="سنگین" note="آنگرید" onClick={() => pick("solar-panel", "gridtie")} /></div>
    </Panel>
    <Panel title="سناریوهای آماده برق اضطراری" meta="Emergency Engine">
      <div className="shil-grid cols-3"><AppCard icon="⌁" title="سبک" onClick={() => pick("backup")} /><AppCard icon="⚡" title="متوسط" onClick={() => pick("backup")} /><AppCard icon="▰" title="سنگین" onClick={() => pick("backup")} /></div>
    </Panel>
  </>;
}

function NewProject({ form, setForm, step, setStep }) {
  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const values = useMemo(() => {
    const daily = Number(String(form.dailyEnergy).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 18;
    const sun = Number(form.sunHours) || 5.2;
    const pr = form.path === "backup" ? 0.88 : 0.79;
    return {
      pv: Math.max(1, daily / (sun * pr)).toFixed(1),
      battery: Math.max(2, (daily * Number(form.autonomy || 1.5)) / (Number(form.systemVoltage || 48) / 48)).toFixed(1),
      inverter: Math.max(Number(form.peakPower || 6) * 1.25, 1).toFixed(1),
      grade: daily < 30 ? "A" : "B+"
    };
  }, [form]);

  return <>
    <Panel title="مسیر طراحی" meta={`${step + 1}/9`}><StepStrip step={step} /></Panel>
    {step === 0 && <Panel title="اطلاعات پروژه" meta="Default + Override"><div className="shil-form"><AppInput label="نام پروژه" value={form.projectName} onChange={update("projectName")} /><AppInput label="کارفرما" value={form.employer} onChange={update("employer")} /><AppInput label="توضیحات" textarea value={form.note} onChange={update("note")} /></div></Panel>}
    {step === 1 && <Panel title="شرایط محیطی" meta="Smart Visual Block"><div className="shil-map"><div><strong>⌖</strong><br />نقشه ایران / موقعیت نصب</div></div><div className="shil-form" style={{marginTop: 10}}><AppInput label="شهر" value={form.city} onChange={update("city")} /><AppInput label="تابش مؤثر روزانه" value={form.sunHours} onChange={update("sunHours")} /><AppInput label="دمای محیط طراحی" value={form.ambientTemp} onChange={update("ambientTemp")} /></div></Panel>}
    {step === 2 && <Panel title="انتخاب مسیر پروژه" meta="Dispatcher"><div className="shil-grid cols-2">{PROJECT_PATH_OPTIONS.map((option) => <AppCard key={option.id} icon={option.id === "backup" ? "⚡" : "☼"} title={option.title} note={option.id === "backup" ? "Emergency Engine" : "Solar Engine"} active={form.path === option.id} onClick={() => setForm((f) => ({...f, path: option.id}))} />)}</div>{form.path === "solar-panel" ? <div className="shil-grid cols-3" style={{marginTop: 10}}>{SOLAR_MODE_OPTIONS.map((option) => <AppCard key={option.value} title={option.label} active={form.solarMode === option.value} onClick={() => setForm((f) => ({...f, solarMode: option.value}))} />)}</div> : null}</Panel>}
    {step === 3 && <Panel title="روش محاسبات" meta="No Finance"><div className="shil-grid cols-2">{CALCULATION_METHODS.map((m) => <AppCard key={m.value} title={m.label} active={form.method === m.value} onClick={() => setForm((f) => ({...f, method: m.value}))} />)}</div></Panel>}
    {step === 4 && <Panel title="ورودی محاسبات" meta="Normalize"><div className="shil-form"><AppInput label="انرژی روزانه kWh" value={form.dailyEnergy} onChange={update("dailyEnergy")} /><AppInput label="توان پیک kW" value={form.peakPower} onChange={update("peakPower")} /><AppInput label="ساعت پشتیبانی" value={form.backupHours} onChange={update("backupHours")} /></div></Panel>}
    {step === 5 && <Panel title="تنظیمات سیستم" meta="Engineering"><div className="shil-form"><AppSelect label="ولتاژ سیستم" value={form.systemVoltage} onChange={update("systemVoltage")} options={[{value:"24", label:"24V"},{value:"48", label:"48V"},{value:"96", label:"96V"}]} /><AppInput label="روزهای Autonomy" value={form.autonomy} onChange={update("autonomy")} /><AppSelect label="نوع نصب" value={form.installType} onChange={update("installType")} options={[{value:"roof", label:"پشت‌بام"},{value:"ground", label:"زمین"},{value:"industrial", label:"صنعتی"}]} /></div></Panel>}
    {step === 6 && <Panel title="چکیده اطلاعات" meta="Review"><div className="shil-metrics"><div className="shil-metric"><b>{form.city}</b><span>موقعیت</span></div><div className="shil-metric"><b>{form.path === "backup" ? "Emergency" : "Solar"}</b><span>موتور</span></div><div className="shil-metric"><b>{form.dailyEnergy}</b><span>kWh/day</span></div><div className="shil-metric"><b>{form.systemVoltage}V</b><span>ولتاژ</span></div></div></Panel>}
    {step === 7 && <Panel title="اجرای محاسبات" meta="Runtime"><div className="shil-warning">Dispatcher آماده است. مسیر انتخاب‌شده به موتور مستقل خورشیدی یا برق اضطراری ارسال می‌شود. این نسخه UI خروجی مهندسی نمونه را بدون داده مالی نمایش می‌دهد.</div><div className="shil-metrics" style={{marginTop: 10}}><div className="shil-metric"><b>{values.pv} kWp</b><span>PV Array</span></div><div className="shil-metric"><b>{values.inverter} kW</b><span>Inverter</span></div></div></Panel>}
    {step === 8 && <Panel title="خروجی نهایی" meta="No Price"><div className="shil-metrics"><div className="shil-metric"><b>{values.grade}</b><span>Validation Grade</span></div><div className="shil-metric"><b>{form.path === "backup" ? "88%" : "79%"}</b><span>Performance Ratio</span></div><div className="shil-metric"><b>{values.battery} kWh</b><span>Battery Bank</span></div><div className="shil-metric"><b>MPPT</b><span>داخل کارت اینورتر</span></div></div></Panel>}
  </>;
}

function SimplePage({ type }) {
  const content = {
    assistant: ["دستیار هوشمند", "کنترل خطا، هشدار مهندسی، بررسی نسبت توان و اعتبارسنجی ورودی‌ها."],
    feedback: ["بازخورد کاربر", "ثبت تجربه کاربری، باگ، پیشنهاد و نیاز پروژه بدون ایجاد گپ اضافی در UI."],
    contact: ["ارتباط با ما", "ایمیل، تلفن، وب‌سایت و شبکه‌های اجتماعی در پنل فشرده صنعتی نمایش داده می‌شوند."]
  }[type];
  return <Panel title={content[0]} meta="Compact"><p style={{margin: 0, color: "var(--shil-muted)", lineHeight: 1.9}}>{content[1]}</p></Panel>;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const workflow = page === "new";
  const title = workflow ? NEW_PROJECT_STEPS[step].title : titles[page] || "SHIL";
  const goDashboard = () => setPage("dashboard");
  const goBack = () => page === "dashboard" ? undefined : setPage("dashboard");
  const confirm = () => setStep((s) => Math.min(NEW_PROJECT_STEPS.length - 1, s + 1));
  const previous = () => setStep((s) => Math.max(0, s - 1));

  return <MobileShell
    header={<MobileHeader title={title} workflow={workflow} onDashboard={goDashboard} onBack={goBack} />}
    footer={<MobileFooter mode={workflow ? "workflow" : "single"} onDashboard={goDashboard} onPrevious={previous} onConfirm={confirm} onSave={() => setPage("projects")} />}
  >
    {page === "dashboard" && <Dashboard go={(id) => { setPage(id); if (id === "new") setStep(0); }} />}
    {page === "projects" && <Projects />}
    {page === "ready" && <ReadyScenarios setForm={setForm} setPage={setPage} />}
    {page === "new" && <NewProject form={form} setForm={setForm} step={step} setStep={setStep} />}
    {["assistant", "feedback", "contact"].includes(page) && <SimplePage type={page} />}
  </MobileShell>;
}
