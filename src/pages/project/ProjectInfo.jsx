import * as React from "react";
import { useNavigate } from "react-router-dom";
import { startManualProjectFlow } from "../../workflow/flowIsolation.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";

export default function ProjectInfo() {
  const navigate = useNavigate();
  const today = React.useMemo(() => new Date().toLocaleDateString("fa-IR"), []);
  const [projectName, setProjectName] = React.useState(() => localStorage.getItem("shil:projectName") || "");
  const [clientName, setClientName] = React.useState(() => localStorage.getItem("shil:clientName") || "");
  const [registrationDate, setRegistrationDate] = React.useState(() => localStorage.getItem("shil:registrationDate") || today);
  const [description, setDescription] = React.useState(() => localStorage.getItem("shil:projectDescription") || "");

  React.useEffect(() => {
    startManualProjectFlow();
  }, []);

  React.useEffect(() => {
    const draft = { projectName, clientName, registrationDate, description };
    localStorage.setItem("shil:projectInfoDraft", JSON.stringify(draft));
    localStorage.setItem("shil:projectName", projectName);
    localStorage.setItem("shil:clientName", clientName);
    localStorage.setItem("shil:registrationDate", registrationDate);
    localStorage.setItem("shil:projectDescription", description);
  }, [projectName, clientName, registrationDate, description]);

  const confirmProjectInfo = () => {
    approveProjectStep("info");
    localStorage.setItem("shil:projectInfoResult", JSON.stringify({
      projectName,
      clientName,
      registrationDate,
      description,
      confirmedAt: new Date().toISOString(),
    }));
    navigate("/new-project/environment");
  };

  return (
    <EngineeringPageShell title="اطلاعات پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>مشخصات اولیه پروژه</h2><span>مرحله ۱</span></div>
          <div className="shil-form-grid">
            <label><span>نام پروژه</span><input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="مثلاً پروژه ویلایی شمال" data-required="true" /></label>
            <label><span>نام کارفرما</span><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="نام شخص یا شرکت" /></label>
            <label><span>تاریخ ثبت</span><input value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} /></label>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>توضیحات پروژه</h2><span>اختیاری</span></div>
          <textarea className="shil-textarea" rows="5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="نیاز پروژه، محدودیت‌ها، توضیحات اجرایی یا نکات مهم را وارد کنید..." />
        </div>

        <div className="shil-section-card shil-auto-result-card">
          <div className="shil-section-head"><h2>نتایج اطلاعات پروژه</h2><span>خلاصه ثبت‌شده</span></div>
          <div className="shil-summary-grid">
            <div><span>نام پروژه</span><strong>{projectName || "ثبت نشده"}</strong></div>
            <div><span>نام کارفرما</span><strong>{clientName || "ثبت نشده"}</strong></div>
            <div><span>تاریخ ثبت</span><strong>{registrationDate || today}</strong></div>
            <div><span>توضیحات</span><strong>{description || "بدون توضیح"}</strong></div>
          </div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmProjectInfo}>تأیید مرحله و ورود به شرایط محیطی</button>
      </section>
    </EngineeringPageShell>
  );
}
