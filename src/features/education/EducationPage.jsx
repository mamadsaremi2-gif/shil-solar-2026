import { useEffect, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";

function renderMarkdownLite(content) {
  const lines = String(content || "").split(/\r?\n/);
  const elements = [];
  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<br key={index} />);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={index}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={index}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={index}>{line.slice(2)}</h1>);
    } else if (line.startsWith("- ")) {
      elements.push(<p key={index} className="education-bullet-v11">• {line.slice(2)}</p>);
    } else {
      elements.push(<p key={index}>{line}</p>);
    }
  });
  return elements;
}

export function EducationPage() {
  const { goDashboard } = useProjectStore();
  const [content, setContent] = useState("در حال بارگذاری محتوای آموزشی...");

  useEffect(() => {
    let active = true;
    fetch("/education-content.md", { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("not-found"))))
      .then((text) => {
        if (active) setContent(text || "هنوز محتوای آموزشی ثبت نشده است.");
      })
      .catch(() => {
        if (active) setContent("# آموزش\n\nهنوز محتوای آموزشی ثبت نشده است. فایل public/education-content.md را تکمیل کنید.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="project-flow-shell education-page-v11" dir="rtl">
      <section className="flow-top-card">
        <button className="btn btn--ghost" type="button" onClick={goDashboard}>داشبورد</button>
        <div className="flow-top-title">
          <strong>آموزش</strong>
          <small>محتوا از فایل اختصاصی آموزش خوانده می‌شود</small>
        </div>
        <span />
      </section>
      <section className="focus-content-card education-content-card-v11">
        <div className="education-content-card-v11__head">
          <span>فایل محتوا</span>
          <code>public/education-content.md</code>
        </div>
        <div className="education-markdown-v11">{renderMarkdownLite(content)}</div>
      </section>
    </main>
  );
}

export default EducationPage;
