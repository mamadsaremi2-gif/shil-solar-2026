import React, { useEffect } from "react";
import { startManualProjectFlow, PROJECT_PATHS } from "../../workflow/flowIsolation.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";

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

export default function ProjectInfo() {
  const domain = readProjectDomain();
  const nextRoute = domain === PROJECT_PATHS.EMERGENCY
    ? "/new-project/method"
    : "/new-project/environment";

  const nextLabel = domain === PROJECT_PATHS.EMERGENCY
    ? "تأیید مرحله و ورود به روش محاسبات"
    : "تأیید مرحله و ورود به شرایط محیطی";

  useEffect(() => {
    startManualProjectFlow(domain);
  }, [domain]);

  return (
    <EngineeringPageShell title="اطلاعات پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>مشخصات اولیه پروژه</h2>
            <span>مرحله ۱</span>
          </div>

          <div className="shil-form-grid">
            <label>
              <span>نام پروژه</span>
              <input defaultValue="X" placeholder="نام پروژه را وارد کنید" data-required="true" />
            </label>

            <label>
              <span>نام کارفرما</span>
              <input defaultValue="SHIL CO" placeholder="نام کارفرما" />
            </label>

            <label>
              <span>تاریخ ثبت</span>
              <input value={new Date().toLocaleDateString("fa-IR")} readOnly />
            </label>
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>توضیحات پروژه</h2>
            <span>اختیاری</span>
          </div>

          <textarea
            className="shil-textarea"
            rows="5"
            placeholder="نیاز پروژه، محدودیت‌ها، توضیحات اجرایی یا نکات مهم را وارد کنید..."
          />
        </div>

        <StepConfirmLink to={nextRoute}>
          {nextLabel}
        </StepConfirmLink>
      </section>
    </EngineeringPageShell>
  );
}
