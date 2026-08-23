import React, { useEffect, useState } from "react";
import { startManualProjectFlow, PROJECT_PATHS } from "../../workflow/flowIsolation.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";
import { readAdminDefaults } from "../../admin/adminStore.js";

function readProjectDomain() {
  try {
    const selected =
      JSON.parse(localStorage.getItem("shil:selectedProjectPath") || "null") ||
      JSON.parse(localStorage.getItem("shil:projectPath") || "null");

    if (typeof selected === "string") return selected;

    return (
      selected?.domain ||
      selected?.type ||
      selected?.key ||
      localStorage.getItem("shil:calculationDomain") ||
      PROJECT_PATHS.SOLAR
    );
  } catch {
    return localStorage.getItem("shil:calculationDomain") || PROJECT_PATHS.SOLAR;
  }
}

function getTodayPersianDateEnglish() {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());

    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}/${values.month}/${values.day}`;
  } catch {
    return new Date().toLocaleDateString("en-US");
  }
}

export default function ProjectInfo() {
  React.useEffect(() => {
    document.body.classList.add("shil-project-info-screen");

    const preventZoom = (event) => {
      if (event.ctrlKey) event.preventDefault();
    };

    const preventGesture = (event) => event.preventDefault();

    window.addEventListener("wheel", preventZoom, { passive: false });
    window.addEventListener("gesturestart", preventGesture, { passive: false });
    window.addEventListener("gesturechange", preventGesture, { passive: false });

    return () => {
      document.body.classList.remove("shil-project-info-screen");
      window.removeEventListener("wheel", preventZoom);
      window.removeEventListener("gesturestart", preventGesture);
      window.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  const domain = readProjectDomain();
  const nextRoute = domain === PROJECT_PATHS.EMERGENCY
    ? "/new-project/method"
    : "/new-project/environment";

  const nextLabel = "تأیید";
  const registrationDate = getTodayPersianDateEnglish();
  const adminDefaults = readAdminDefaults();
  const previousProject = (() => { try { return JSON.parse(localStorage.getItem("shil:projectInfoDraft") || "null") || {}; } catch { return {}; } })();
  const [projectName, setProjectName] = useState(previousProject.projectName || adminDefaults.defaultProjectName || "کاربر");
  const [clientName, setClientName] = useState(previousProject.clientName || adminDefaults.defaultClientName || "SHIL CO");
  const [description, setDescription] = useState(previousProject.description || "");

  const persistProjectInfo = () => {
    localStorage.setItem("shil:projectInfoDraft", JSON.stringify({
      projectName: projectName.trim(), clientName: clientName.trim(), registrationDate, description: description.trim(), domain,
    }));
  };

  useEffect(() => {
    startManualProjectFlow(domain);
  }, [domain]);

  return (
    <EngineeringPageShell title="اطلاعات پروژه">
      <div id="shil-project-info-root" className={`shil-project-info-page shil-equipment-page shil-calculation-inputs-page ${domain === PROJECT_PATHS.EMERGENCY ? "shil-project-info-emergency" : ""}`}>
        <section className="shil-project-info-primary-fields-v131">
          <div className="shil-project-info-section-title-v131">
            <h2>مشخصات اولیه پروژه</h2>
          </div>

          <div className="shil-project-info-top-row-v131">
            <label className="shil-project-info-card-v131 shil-project-name-field-v131">
              <span>نام پروژه</span>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="نام پروژه را وارد کنید" data-required="true" />
            </label>

            <label className="shil-project-info-card-v131 shil-client-name-field-v131">
              <span>نام کارفرما</span>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="نام کارفرما" />
            </label>
          </div>

          <div className="shil-project-info-date-row-v131">
            <label className="shil-project-info-card-v131 shil-registration-date-field-v131">
              <span>تاریخ ثبت</span>
              <input className="shil-registration-date-input-v131" value={registrationDate} readOnly dir="ltr" />
            </label>
          </div>
        </section>

        <section className="shil-project-info-calc-card shil-project-info-description-card">
          <div className="shil-project-info-section-title-v131 shil-project-info-description-title-v131">
            <h2>توضیحات پروژه</h2>
            <span>اختیاری</span>
          </div>

          <textarea
          className="shil-textarea shil-field-card shil-project-description-clean"
          rows="5" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="نیاز پروژه، محدودیت‌ها، توضیحات اجرایی یا نکات مهم را وارد کنید..."
          />
        </section>

        <div onClick={persistProjectInfo}><StepConfirmLink to={nextRoute}>
          {nextLabel}
        </StepConfirmLink></div>
      </div>
    </EngineeringPageShell>
  );
}


