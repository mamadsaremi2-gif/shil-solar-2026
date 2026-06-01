import React, { useEffect, useMemo, useState } from "react";
import { startManualProjectFlow } from "../../workflow/flowIsolation.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";

export default function ProjectInfo() {
  const registrationDate = useMemo(() => new Date().toLocaleDateString("fa-IR"), []);
  const [projectInfo, setProjectInfo] = useState({
    projectName: "X",
    employerName: "SHIL CO",
    registrationDate,
  });

  useEffect(() => {
    startManualProjectFlow();
  }, []);

  const updateProjectInfo = (field) => (event) => {
    setProjectInfo((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const summaryItems = [
    { label: "نام پروژه", value: projectInfo.projectName },
    { label: "نام کارفرما", value: projectInfo.employerName },
    { label: "تاریخ ثبت", value: projectInfo.registrationDate },
  ];

  return (
    <EngineeringPageShell title="اطلاعات پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>مشخصات اولیه پروژه</h2><span>مرحله ۱</span></div>
          <div className="shil-form-grid">
            <label>
              <span>نام پروژه</span>
              <input
                value={projectInfo.projectName}
                onChange={updateProjectInfo("projectName")}
                placeholder="مثلاً پروژه ویلایی شمال"
                data-required="true"
              />
            </label>
            <label>
              <span>نام کارفرما</span>
              <input
                value={projectInfo.employerName}
                onChange={updateProjectInfo("employerName")}
                placeholder="نام شخص یا شرکت"
              />
            </label>
            <label>
              <span>تاریخ ثبت</span>
              <input value={projectInfo.registrationDate} readOnly />
            </label>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>توضیحات پروژه</h2><span>اختیاری</span></div>
          <textarea className="shil-textarea" rows="5" placeholder="نیاز پروژه، محدودیت‌ها، توضیحات اجرایی یا نکات مهم را وارد کنید..." />
        </div>

        <div className="shil-section-card shil-project-info-summary">
          <div className="shil-section-head"><h2>چکیده اطلاعات پروژه</h2><span>پیش‌نمایش</span></div>
          <div className="shil-form-grid">
            {summaryItems.map((item) => (
              <div className="shil-summary-field" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value || "ثبت نشده"}</strong>
              </div>
            ))}
          </div>
        </div>

        <StepConfirmLink to="/new-project/environment">تأیید مرحله و ورود به شرایط محیطی</StepConfirmLink>
      </section>
    </EngineeringPageShell>
  );
}
