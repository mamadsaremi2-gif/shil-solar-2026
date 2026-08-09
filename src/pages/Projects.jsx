import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Filter,
  FolderKanban,
  Layers3,
  Play,
  RotateCcw,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import {
  archiveManagedProject,
  deleteManagedProject,
  exportManagedProject,
  listManagedProjects,
  restoreManagedProject,
} from "../workflow/projectManagement100.js";
import { activateManagedProject } from "../workflow/projectSessionPersistence.js";

const STEP_TITLES = {
  info: "اطلاعات پروژه",
  environment: "شرایط محیطی",
  path: "انتخاب مسیر",
  method: "روش طراحی",
  inputs: "ورودی محاسبات",
  system: "تنظیمات",
  summary: "چکیده طراحی",
  run: "اجرا و خروجی",
};

const STEP_ORDER = ["info", "environment", "path", "method", "inputs", "system", "summary", "run"];
const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return "بدون تاریخ";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function domainLabel(domain) {
  return domain === "emergency" ? "برق اضطراری" : "خورشیدی";
}

function statusLabel(status) {
  if (status === "final") return "نهایی";
  if (status === "archived") return "آرشیو";
  return "در حال اجرا";
}

function progressFor(row) {
  if (row.status === "final") return 100;
  const index = STEP_ORDER.indexOf(row.currentStep);
  if (index < 0) return 0;
  return Math.max(8, Math.round(((index + 1) / STEP_ORDER.length) * 100));
}

function methodLabel(row) {
  const snap = row?.snapshot || {};
  const method = snap?.calculationInputs?.method || snap?.calculationInputs?.type || snap?.workflow?.method || snap?.localState?.calculationMethod;
  const labels = {
    equipment: "لیست تجهیزات",
    power: "توان کل",
    current: "جریان کل",
    solar_panel_power: "توان پنل خورشیدی",
    profile: "پروفایل مصرف",
    energy: "انرژی روزانه",
  };
  return labels[method] || method || "ثبت نشده";
}

function equipmentCount(row) {
  const snap = row?.snapshot || {};
  const inputs = snap?.calculationInputs || {};
  const candidates = [
    inputs?.equipmentItems,
    inputs?.selectedItems,
    snap?.localState?.selectedEquipmentItems,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item.length;
  }
  const count = inputs?.equipmentStats?.selectedCount || snap?.summary?.equipmentStats?.selectedCount;
  return Number.isFinite(Number(count)) ? Number(count) : null;
}

function ProjectCard({ row, onRefresh }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isFinal = row.status === "final";
  const isArchived = row.status === "archived";
  const progress = progressFor(row);
  const count = equipmentCount(row);
  const Icon = row.domain === "emergency" ? BatteryCharging : Sun;

  function runAction(event, action) {
    event.preventDefault();
    event.stopPropagation();
    action();
    onRefresh();
  }

  function openProject(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const restored = activateManagedProject(row.projectKey);
    if (!restored) return;
    navigate(row.resumeUrl || "/new-project/info");
  }

  return (
    <article className={`shil-pm-card shil-pm-card--${row.status || "running"} ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="shil-pm-card-summary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="shil-pm-domain-icon" aria-hidden="true"><Icon size={20} /></span>
        <span className="shil-pm-card-copy">
          <strong>{row.title || "پروژه بدون عنوان"}</strong>
          <small>{domainLabel(row.domain)} · {STEP_TITLES[row.currentStep] || "مرحله نامشخص"}</small>
        </span>
        <span className={`shil-pm-status shil-pm-status--${row.status || "running"}`}>{statusLabel(row.status)}</span>
        <ChevronDown className="shil-pm-chevron" size={18} />
      </button>

      <div className="shil-pm-progress" aria-label={`پیشرفت ${progress} درصد`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      {open ? (
        <div className="shil-pm-card-details">
          <div className="shil-pm-detail-grid">
            <div><span>پیشرفت</span><strong>{progress}%</strong></div>
            <div><span>آخرین مرحله</span><strong>{STEP_TITLES[row.currentStep] || "نامشخص"}</strong></div>
            <div><span>روش طراحی</span><strong>{methodLabel(row)}</strong></div>
            <div><span>تجهیزات</span><strong>{count == null ? "ثبت نشده" : `${count} مورد`}</strong></div>
            <div className="shil-pm-detail-wide"><span>آخرین ذخیره</span><strong>{formatDate(row.updatedAt || row.lastVisitedAt || row.createdAt)}</strong></div>
          </div>

          <details className="shil-pm-timeline">
            <summary>مسیر پروژه</summary>
            <div className="shil-pm-timeline-list">
              {STEP_ORDER.map((step, index) => {
                const currentIndex = STEP_ORDER.indexOf(row.currentStep);
                const done = isFinal || index < currentIndex;
                const current = !isFinal && index === currentIndex;
                return (
                  <div key={step} className={done ? "is-done" : current ? "is-current" : "is-pending"}>
                    <span>{done ? "✓" : current ? "●" : "○"}</span>
                    <strong>{STEP_TITLES[step]}</strong>
                  </div>
                );
              })}
            </div>
          </details>

          <div className="shil-pm-actions">
            {!isArchived ? (
              <button type="button" className="primary" onClick={openProject}>
                {isFinal ? <Eye size={15} /> : <Play size={15} />}
                {isFinal ? "مشاهده خروجی" : "ادامه پروژه"}
              </button>
            ) : null}
            <button type="button" onClick={(event) => runAction(event, () => exportManagedProject(row))}><Download size={15} /> خروجی JSON</button>
            {!isFinal && !isArchived ? <button type="button" onClick={(event) => runAction(event, () => archiveManagedProject(row.projectKey))}><Archive size={15} /> آرشیو</button> : null}
            {isArchived ? <button type="button" className="primary" onClick={(event) => runAction(event, () => restoreManagedProject(row.projectKey))}><RotateCcw size={15} /> بازگردانی</button> : null}
            <button type="button" className="danger" onClick={(event) => runAction(event, () => deleteManagedProject(row.projectKey))}><Trash2 size={15} /> حذف</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ProjectList({ type }) {
  const title = type === "final" ? "پروژه‌های نهایی" : type === "archived" ? "آرشیو پروژه‌ها" : "پروژه‌های در حال اجرا";
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const refresh = () => setRows(listManagedProjects(type));

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    window.addEventListener("shil-workflow-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("shil-workflow-updated", handler);
    };
  }, [type]);

  useEffect(() => setPage(1), [query, domain, sort, type]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    const next = rows.filter((row) => {
      const matchesDomain = domain === "all" || row.domain === domain;
      const haystack = `${row.title || ""} ${domainLabel(row.domain)} ${STEP_TITLES[row.currentStep] || ""}`.toLocaleLowerCase("fa-IR");
      return matchesDomain && (!normalized || haystack.includes(normalized));
    });
    return next.sort((a, b) => {
      if (sort === "name") return String(a.title || "").localeCompare(String(b.title || ""), "fa");
      if (sort === "progress") return progressFor(b) - progressFor(a);
      if (sort === "created") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return new Date(b.updatedAt || b.lastVisitedAt || 0) - new Date(a.updatedAt || a.lastVisitedAt || 0);
    });
  }, [rows, query, domain, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice(0, page * PAGE_SIZE);

  return (
    <ShilPageShell title={title} className={`shil-project-manager-page shil-project-manager-page--${type}`}>
      <div className="shil-pm-workspace">
        <section className="shil-pm-toolbar" aria-label="جستجو و فیلتر پروژه‌ها">
          <label className="shil-pm-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی پروژه..." />
          </label>
          <label className="shil-pm-select"><Filter size={15} /><select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="all">همه مسیرها</option><option value="solar">خورشیدی</option><option value="emergency">برق اضطراری</option></select></label>
          <label className="shil-pm-select"><Layers3 size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="updated">آخرین تغییر</option><option value="created">تاریخ ایجاد</option><option value="name">نام پروژه</option><option value="progress">درصد پیشرفت</option></select></label>
        </section>

        <div className="shil-pm-list-head">
          <strong>{title}</strong>
          <span>{filteredRows.length} پروژه</span>
        </div>

        <section className="shil-pm-list">
          {visibleRows.map((row) => <ProjectCard key={row.projectKey || row.id} row={row} onRefresh={refresh} />)}
          {!filteredRows.length ? (
            <article className="shil-pm-empty">
              <FolderKanban size={30} />
              <strong>{rows.length ? "پروژه‌ای مطابق فیلتر پیدا نشد" : "هنوز پروژه‌ای ثبت نشده است"}</strong>
              <span>{rows.length ? "عبارت جستجو یا فیلتر مسیر را تغییر دهید." : "با شروع پروژه جدید، ذخیره مرحله‌ای به‌صورت خودکار در این بخش ثبت می‌شود."}</span>
              {!rows.length && type === "running" ? <Link to="/new-project">+ شروع پروژه جدید</Link> : null}
            </article>
          ) : null}
        </section>

        {visibleRows.length < filteredRows.length ? (
          <button type="button" className="shil-pm-load-more" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            نمایش {Math.min(PAGE_SIZE, filteredRows.length - visibleRows.length)} پروژه بعدی
          </button>
        ) : null}
      </div>
    </ShilPageShell>
  );
}

function ProjectsLanding() {
  const [counts, setCounts] = useState({ running: 0, final: 0, archived: 0 });
  useEffect(() => {
    const refresh = () => setCounts({
      running: listManagedProjects("running").length,
      final: listManagedProjects("final").length,
      archived: listManagedProjects("archived").length,
    });
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("shil-workflow-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("shil-workflow-updated", refresh);
    };
  }, []);

  return (
    <ShilPageShell title="مدیریت پروژه‌ها" className="shil-projects-landing-v529 shil-projects-phase2">
      <section className="shil-pm-menu">
        <div className="shil-pm-menu-title"><FolderKanban size={18} /><strong>مدیریت و پیگیری پروژه‌ها</strong></div>
        <Link to="/projects/running" className="shil-pm-menu-card shil-pm-menu-card--running"><span className="icon"><Clock3 size={22} /></span><span className="copy"><strong>پروژه‌های در حال اجرا</strong><small>ادامه از آخرین مرحله ذخیره‌شده</small></span><span className="count">{counts.running}</span></Link>
        <Link to="/projects/final" className="shil-pm-menu-card shil-pm-menu-card--final"><span className="icon"><CheckCircle2 size={22} /></span><span className="copy"><strong>پروژه‌های نهایی</strong><small>خروجی‌ها و گزارش‌های تکمیل‌شده</small></span><span className="count">{counts.final}</span></Link>
        <Link to="/projects/archived" className="shil-pm-menu-card shil-pm-menu-card--archived"><span className="icon"><Archive size={22} /></span><span className="copy"><strong>آرشیو پروژه‌ها</strong><small>پروژه‌های کنار گذاشته‌شده</small></span><span className="count">{counts.archived}</span></Link>
        <div className="shil-pm-menu-note"><CalendarDays size={15} /><span>کارت‌ها فشرده هستند و جزئیات هر پروژه فقط در صورت نیاز باز می‌شود.</span></div>
      </section>
    </ShilPageShell>
  );
}

export default function Projects({ view }) {
  if (view) return <ProjectList type={view} />;
  return <ProjectsLanding />;
}
