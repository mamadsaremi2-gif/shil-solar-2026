import React from "react";

const iconPaths = {
  ai: ["M12 3.5v2", "M12 18.5v2", "M4.5 12h2", "M17.5 12h2", "M7.6 7.6l1.4 1.4", "M15 15l1.4 1.4", "M16.4 7.6 15 9", "M9 15l-1.4 1.4", "M9 10.5h6", "M9 13.5h6", "M10 8h4a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3Z"],
  plus: ["M12 5v14", "M5 12h14"],
  folder: ["M3.5 7.5h6l1.7 2H20.5v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10.5Z", "M3.5 9.5h17"],
  education: ["M4 9l8-4 8 4-8 4-8-4Z", "M7 11v4.2c0 1.3 2.2 2.8 5 2.8s5-1.5 5-2.8V11", "M20 9v5"],
  phone: ["M8 4.5l2 4-2.2 1.6c1.1 2.2 2.9 4 5.1 5.1l1.6-2.2 4 2v3.2c0 .9-.7 1.6-1.6 1.6C9.8 19.8 4.2 14.2 4.2 7.1c0-.9.7-1.6 1.6-1.6H8Z"],
  bolt: ["M13 2.8 5.8 13h5.4L10.8 21.2 18.2 10h-5.5L13 2.8Z"],
  chat: ["M4 5.5h16v10H8l-4 4v-14Z", "M8 9h8", "M8 12h5"],
  logout: ["M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4", "M14 8l4 4-4 4", "M18 12H9"],
  sun: ["M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z", "M12 2.5v2", "M12 19.5v2", "M4.5 12h-2", "M21.5 12h-2", "M5.6 5.6 7 7", "M17 17l1.4 1.4", "M18.4 5.6 17 7", "M7 17l-1.4 1.4"],
  battery: ["M4 8h14v8H4V8Z", "M18 10h2v4h-2", "M7 11v2", "M10 11v2", "M13 11v2"],
  home: ["M4 11.5 12 5l8 6.5", "M6.5 10.5V19h11v-8.5", "M10 19v-5h4v5"],
  building: ["M5 20V5h9v15", "M14 9h5v11", "M8 8h2", "M8 12h2", "M8 16h2", "M16 12h1", "M16 16h1"],
  industry: ["M3.5 20V9.5l5 3V9.5l5 3V7h7v13", "M6 16h2", "M11 16h2", "M16 16h2"]
};

export default function ShilIcon({ name = "plus", className = "", title }) {
  const paths = iconPaths[name] || iconPaths.plus;
  return (
    <svg className={`shil-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {paths.map((d, index) => (
        <path key={index} d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
