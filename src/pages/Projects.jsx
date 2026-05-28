import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, CheckCircle2, Clock3, Download, RotateCcw, Trash2 } from "lucide-react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import {
  archiveManagedProject,
  deleteManagedProject,
  exportManagedProject,
  listManagedProjects,
  restoreManagedProject,
} from "../workflow/projectManagement100.js";

const STEP_TITLES = {
  info: "اطلاعات پروژه",
  environment: "شرایط محیطی",
  path: "انتخاب مسیر",
  method: "روش محاسبات",
  inputs: "ورودی محاسبات",
  system: "تنظیمات سیستم",
  summary: "چکیده اطلاعات",
  run: "اجرای محاسبات",
};

function formatDate(value) {
  if (!value) return "بدون تاریخ";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function domainLabel(domain) {
  return domain === "emergency" ? "برق اضطراری" : "خورشیدی";
}

function ProjectCard({ row, type, onRefresh }) {
  const navigate = useNavigate();
  const isFinal = row.status === "final";
  const isArchived = row.status === "archived";

  function runAction(event, action) {
    event.preventDefault();
    event.stopPropagation();
    action();
    onRefresh();
  }

  return (
    <article className={`shil-project-manager-card ${isFinal ? "is-final" : "is-running"}`}>
      <Link className="shil-project-manager-main" to={row.resumeUrl || "/new-project/info"}>
        <div className="shil-project-manager-topline">
          <strong>{row.title || "پروژه بدون عنوان"}</strong>
          <span>{isFinal ? "نهایی" : isArchived ? "آرشیو" : "در حال اجرا"}</span>
        </div>
        <div className="shil-project-manager-meta">
          <span>{domainLabel(row.domain)}</span>
          <span>{STEP_TITLES[row.currentStep] || "مرحله نامشخص"}</span>
          <span>{formatDate(row.updatedAt || row.lastVisitedAt || row.createdAt)}</span>
        </div>
        <p>{isFinal ? "پروژه تکمیل شده و آماده خروجی مهندسی است." : "از آخرین مرحله ذخیره‌شده ادامه بده."}</p>
      </Link>
      <div className="shil-project-manager-actions">
        <button type="button" onClick={() => navigate(row.resumeUrl || "/new-project/info")}>{isFinal ? "مشاهده خروجی" : "ادامه پروژه"}</button>
        <button type="button" onClick={(event) => runAction(event, () => exportManagedProject(row))}><Download size={16} /> خروجی JSON</button>
        {!isFinal && !isArchived ? <button type="button" onClick={(event) => runAction(event, () => archiveManagedProject(row.projectKey))}><Archive size={16} /> آرشیو</button> : null}
        {isArchived ? <button type="button" onClick={(event) => runAction(event, () => restoreManagedProject(row.projectKey))}><RotateCcw size={16} /> بازگردانی</button> : null}
        <button type="button" className="danger" onClick={(event) => runAction(event, () => deleteManagedProject(row.projectKey))}><Trash2 size={16} /> حذف</button>
      </div>
    </article>
  );
}

function ProjectList({ type }) {
  const title = type === "final" ? "پروژه‌های نهایی" : type === "archived" ? "آرشیو پروژه‌ها" : "پروژه‌های در حال اجرا";
  const [rows, setRows] = React.useState([]);
  const refresh = () => setRows(listManagedProjects(type));

  React.useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    window.addEventListener("shil-workflow-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("shil-workflow-updated", handler);
    };
  }, [type]);

  return (
    <ShilPageShell title={title}>
      <section className="shil-project-manager-list">
        {rows.map((row) => <ProjectCard key={row.projectKey || row.id} row={row} type={type} onRefresh={refresh} />)}
        {!rows.length ? (
          <article className="shil-mini-project-card">
            <strong>هنوز پروژه‌ای ثبت نشده است</strong>
            <span>وقتی کاربر هر مرحله‌ای را شروع کند، پروژه به‌صورت خودکار اینجا ذخیره می‌شود.</span>
          </article>
        ) : null}
      </section>
    </ShilPageShell>
  );
}

export default function Projects({ view }) {
  if (view) return <ProjectList type={view} />;
  return (
    <ShilPageShell title="مدیریت پروژه‌ها">
      <section className="shil-two-card-grid">
        <Link to="/projects/running" className="shil-nav-card"><Clock3 size={48} /><h3>پروژه‌های در حال اجرا</h3><p>ادامه از آخرین مرحله ذخیره‌شده</p></Link>
        <Link to="/projects/final" className="shil-nav-card"><CheckCircle2 size={48} /><h3>پروژه‌های نهایی</h3><p>خروجی‌ها و گزارش‌های تکمیل‌شده</p></Link>
        <Link to="/projects/archived" className="shil-nav-card"><Archive size={48} /><h3>آرشیو پروژه‌ها</h3><p>پروژه‌های کنار گذاشته‌شده</p></Link>
      </section>
    </ShilPageShell>
  );
}
