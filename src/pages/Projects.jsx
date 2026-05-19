import React, { useEffect, useState } from "react";
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
  info: "Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡",
  environment: "Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ",
  path: "Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø³ÛŒØ±",
  method: "Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª",
  inputs: "ÙˆØ±ÙˆØ¯ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª",
  system: "ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø³ÛŒØ³ØªÙ…",
  summary: "Ú†Ú©ÛŒØ¯Ù‡ Ø§Ø·Ù„Ø§Ø¹Ø§Øª",
  run: "Ø§Ø¬Ø±Ø§ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª",
};

function formatDate(value) {
  if (!value) return "Ø¨Ø¯ÙˆÙ† ØªØ§Ø±ÛŒØ®";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function domainLabel(domain) {
  return domain === "emergency" ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ";
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
          <strong>{row.title || "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†"}</strong>
          <span>{isFinal ? "Ù†Ù‡Ø§ÛŒÛŒ" : isArchived ? "Ø¢Ø±Ø´ÛŒÙˆ" : "Ø¯Ø± Ø­Ø§Ù„ Ø§Ø¬Ø±Ø§"}</span>
        </div>
        <div className="shil-project-manager-meta">
          <span>{domainLabel(row.domain)}</span>
          <span>{STEP_TITLES[row.currentStep] || "Ù…Ø±Ø­Ù„Ù‡ Ù†Ø§Ù…Ø´Ø®Øµ"}</span>
          <span>{formatDate(row.updatedAt || row.lastVisitedAt || row.createdAt)}</span>
        </div>
        <p>{isFinal ? "Ù¾Ø±ÙˆÚ˜Ù‡ ØªÚ©Ù…ÛŒÙ„ Ø´Ø¯Ù‡ Ùˆ Ø¢Ù…Ø§Ø¯Ù‡ Ø®Ø±ÙˆØ¬ÛŒ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø§Ø³Øª." : "Ø§Ø² Ø¢Ø®Ø±ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ø°Ø®ÛŒØ±Ù‡â€ŒØ´Ø¯Ù‡ Ø§Ø¯Ø§Ù…Ù‡ Ø¨Ø¯Ù‡."}</p>
      </Link>
      <div className="shil-project-manager-actions">
        <button type="button" onClick={() => navigate(row.resumeUrl || "/new-project/info")}>{isFinal ? "Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø®Ø±ÙˆØ¬ÛŒ" : "Ø§Ø¯Ø§Ù…Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡"}</button>
        <button type="button" onClick={(event) => runAction(event, () => exportManagedProject(row))}><Download size={16} /> Ø®Ø±ÙˆØ¬ÛŒ JSON</button>
        {!isFinal && !isArchived ? <button type="button" onClick={(event) => runAction(event, () => archiveManagedProject(row.projectKey))}><Archive size={16} /> Ø¢Ø±Ø´ÛŒÙˆ</button> : null}
        {isArchived ? <button type="button" onClick={(event) => runAction(event, () => restoreManagedProject(row.projectKey))}><RotateCcw size={16} /> Ø¨Ø§Ø²Ú¯Ø±Ø¯Ø§Ù†ÛŒ</button> : null}
        <button type="button" className="danger" onClick={(event) => runAction(event, () => deleteManagedProject(row.projectKey))}><Trash2 size={16} /> Ø­Ø°Ù</button>
      </div>
    </article>
  );
}

function ProjectList({ type }) {
  const title = type === "final" ? "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ù‡Ø§ÛŒÛŒ" : type === "archived" ? "Ø¢Ø±Ø´ÛŒÙˆ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§" : "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¯Ø± Ø­Ø§Ù„ Ø§Ø¬Ø±Ø§";
  const [rows, setRows] = useState([]);
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

  return (
    <ShilPageShell title={title}>
      <section className="shil-project-manager-list">
        {rows.map((row) => <ProjectCard key={row.projectKey || row.id} row={row} type={type} onRefresh={refresh} />)}
        {!rows.length ? (
          <article className="shil-mini-project-card">
            <strong>Ù‡Ù†ÙˆØ² Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª</strong>
            <span>ÙˆÙ‚ØªÛŒ Ú©Ø§Ø±Ø¨Ø± Ù‡Ø± Ù…Ø±Ø­Ù„Ù‡â€ŒØ§ÛŒ Ø±Ø§ Ø´Ø±ÙˆØ¹ Ú©Ù†Ø¯ØŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ø®ÙˆØ¯Ú©Ø§Ø± Ø§ÛŒÙ†Ø¬Ø§ Ø°Ø®ÛŒØ±Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.</span>
          </article>
        ) : null}
      </section>
    </ShilPageShell>
  );
}

export default function Projects({ view }) {
  if (view) return <ProjectList type={view} />;
  return (
    <ShilPageShell title="Ù…Ø¯ÛŒØ±ÛŒØª Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§">
      <section className="shil-two-card-grid">
        <Link to="/projects/running" className="shil-nav-card"><Clock3 size={48} /><h3>Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¯Ø± Ø­Ø§Ù„ Ø§Ø¬Ø±Ø§</h3><p>Ø§Ø¯Ø§Ù…Ù‡ Ø§Ø² Ø¢Ø®Ø±ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ø°Ø®ÛŒØ±Ù‡â€ŒØ´Ø¯Ù‡</p></Link>
        <Link to="/projects/final" className="shil-nav-card"><CheckCircle2 size={48} /><h3>Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ù‡Ø§ÛŒÛŒ</h3><p>Ø®Ø±ÙˆØ¬ÛŒâ€ŒÙ‡Ø§ Ùˆ Ú¯Ø²Ø§Ø±Ø´â€ŒÙ‡Ø§ÛŒ ØªÚ©Ù…ÛŒÙ„â€ŒØ´Ø¯Ù‡</p></Link>
        <Link to="/projects/archived" className="shil-nav-card"><Archive size={48} /><h3>Ø¢Ø±Ø´ÛŒÙˆ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§</h3><p>Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ú©Ù†Ø§Ø± Ú¯Ø°Ø§Ø´ØªÙ‡â€ŒØ´Ø¯Ù‡</p></Link>
      </section>
    </ShilPageShell>
  );
}
