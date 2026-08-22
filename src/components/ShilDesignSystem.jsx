import React from "react";

export function PageStack({ children, className = "" }) {
  return <div className={`shil-ds-page-stack ${className}`.trim()}>{children}</div>;
}

export function PageIntro({ title, description, meta }) {
  if (!title && !description && !meta) return null;
  return (
    <header className="shil-ds-page-intro">
      <div className="shil-ds-page-intro-row">
        {title ? <h1 className="shil-ds-page-title">{title}</h1> : null}
        {meta ? <span className="shil-ds-page-meta">{meta}</span> : null}
      </div>
      {description ? <p className="shil-ds-helper-text">{description}</p> : null}
    </header>
  );
}

export function DataSection({ title, meta, children, className = "", as: Tag = "section" }) {
  return (
    <Tag className={`shil-ds-section ${className}`.trim()}>
      {(title || meta) ? (
        <div className="shil-ds-section-head">
          {title ? <h2 className="shil-ds-section-title">{title}</h2> : null}
          {meta ? <span className="shil-ds-section-meta">{meta}</span> : null}
        </div>
      ) : null}
      <div className="shil-ds-section-body">{children}</div>
    </Tag>
  );
}

export function DataGrid({ rows = [], className = "" }) {
  return (
    <div className={`shil-ds-data-grid ${className}`.trim()}>
      {rows.filter(Boolean).map(([label, value]) => (
        <div key={label} className="shil-ds-data-item">
          <span className="shil-ds-data-label">{label}</span>
          <strong className="shil-ds-data-value">{value || "-"}</strong>
        </div>
      ))}
    </div>
  );
}

export function StatusMessage({ children, tone = "warning" }) {
  return <div className={`shil-ds-status shil-ds-status--${tone}`}>{children}</div>;
}

export function ActionBar({ children, className = "" }) {
  return <div className={`shil-ds-action-bar ${className}`.trim()}>{children}</div>;
}
