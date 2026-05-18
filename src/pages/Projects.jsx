import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, CheckCircle2 } from "lucide-react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { readUserRecords } from "../auth/session.js";

function ProjectList({ type }) {
  const title = type === "final" ? "پروژه های نهایی" : "پروژهای در حال اجرا";
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const projects = readUserRecords("shil-projects", []);
    const filtered = projects.filter((item) => type === "final" ? item.status === "final" : item.status !== "final");
    setRows(filtered);
  }, [type]);

  return (
    <ShilPageShell title={title}>
      <section className="shil-list-panel">
        {rows.map((row) => (
          <article className="shil-mini-project-card" key={row.id}>
            <strong>{row.title || "پروژه بدون عنوان"}</strong>
            <span>{type === "final" ? "آماده خروجی گزارش" : "قابل ادامه و ویرایش"}</span>
          </article>
        ))}
        {!rows.length ? <article className="shil-mini-project-card"><strong>هنوز پروژه‌ای ثبت نشده است</strong><span>داده‌های این صفحه فقط برای همین کاربر نمایش داده می‌شود.</span></article> : null}
      </section>
    </ShilPageShell>
  );
}

export default function Projects({ view }) {
  if (view) return <ProjectList type={view} />;
  return (
    <ShilPageShell title="مدیریت پروژه ها">
      <section className="shil-two-card-grid">
        <Link to="/projects/running" className="shil-nav-card"><Clock3 size={42} /><h3>پروژهای در حال اجرا</h3></Link>
        <Link to="/projects/final" className="shil-nav-card"><CheckCircle2 size={42} /><h3>پروژه های نهایی</h3></Link>
      </section>
    </ShilPageShell>
  );
}
