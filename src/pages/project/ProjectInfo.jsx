import React from "react";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";

export default function ProjectInfo() {
  return (
    <EngineeringPageShell title="اطلاعات پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>مشخصات اولیه پروژه</h2><span>مرحله ۱</span></div>
          <div className="shil-form-grid">
            <label><span>نام پروژه</span><input placeholder="مثلاً پروژه ویلایی شمال" data-required="true" /></label>
            <label><span>نام کارفرما</span><input placeholder="نام شخص یا شرکت" /></label>
            <label><span>نوع کاربری</span><select data-required="true"><option value="">انتخاب کنید</option><option>خانگی</option><option>اداری</option><option>تجاری</option><option>صنعتی</option><option>کشاورزی</option></select></label>
            <label><span>تاریخ ثبت</span><input value={new Date().toLocaleDateString("fa-IR")} readOnly /></label>
          </div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>توضیحات پروژه</h2><span>اختیاری</span></div>
          <textarea className="shil-textarea" rows="5" placeholder="نیاز پروژه، محدودیت‌ها، توضیحات اجرایی یا نکات مهم را وارد کنید..." />
        </div>
        <StepConfirmLink to="/new-project/environment">تأیید مرحله و ورود به شرایط محیطی</StepConfirmLink>
      </section>
    </EngineeringPageShell>
  );
}
