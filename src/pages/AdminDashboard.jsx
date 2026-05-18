import React, { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { clearSession, getCurrentSession, readAllUserRecords } from "../auth/session.js";

function StatCard({ title, value }) {
  return <article className="shil-admin-stat"><strong>{value}</strong><span>{title}</span></article>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const data = useMemo(() => {
    const feedback = readAllUserRecords("shil-feedback");
    const assistant = readAllUserRecords("shil-assistant-questions");
    const projects = readAllUserRecords("shil-projects");
    const userIds = new Set([...feedback, ...assistant, ...projects].map((item) => item.userId).filter(Boolean));
    return { feedback, assistant, projects, userCount: userIds.size };
  }, []);

  if (session?.role !== "admin") return <Navigate to="/login" replace />;

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <ShilPageShell title="کارتابل ادمین SHIL">
      <section className="shil-admin-grid">
        <StatCard title="کاربران دارای داده" value={data.userCount} />
        <StatCard title="پروژه‌های ثبت‌شده" value={data.projects.length} />
        <StatCard title="سوالات هوش مصنوعی" value={data.assistant.length} />
        <StatCard title="نظرات کاربران" value={data.feedback.length} />
      </section>

      <section className="shil-thread-list">
        <article className="shil-thread-card">
          <h3>آخرین نظرات</h3>
          {data.feedback.slice(0, 8).map((item) => (
            <p key={item.id}><strong>{item.userLogin || item.userId}:</strong> {item.category} — {item.text}</p>
          ))}
          {!data.feedback.length ? <p>هنوز نظری ثبت نشده است.</p> : null}
        </article>

        <article className="shil-thread-card">
          <h3>آخرین سوالات هوش مصنوعی</h3>
          {data.assistant.slice(0, 8).map((item) => (
            <p key={item.id}><strong>{item.userLogin || item.userId}:</strong> {item.title}</p>
          ))}
          {!data.assistant.length ? <p>هنوز سوالی ثبت نشده است.</p> : null}
        </article>
      </section>

      <button type="button" className="shil-guest-btn" onClick={logout}>خروج از کارتابل ادمین</button>
    </ShilPageShell>
  );
}
