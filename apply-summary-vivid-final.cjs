const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const markerStart = "/* SHIL_SUMMARY_VIVID_FINAL_START */";
const markerEnd = "/* SHIL_SUMMARY_VIVID_FINAL_END */";

const css = `
${markerStart}

/* پاکسازی و ظاهر نهایی صفحه چکیده */
html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-section-card{
  background: rgba(215,235,255,.35) !important;
  border: 1px solid rgba(120,230,255,.85) !important;
  border-right: 1px solid rgba(120,230,255,.85) !important;
  border-radius: 18px !important;
  box-shadow:
    0 8px 22px rgba(0,0,0,.18),
    inset 0 0 18px rgba(160,235,255,.28) !important;
  padding: 8px !important;
  margin: 14px 0 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-section-head{
  height: 34px !important;
  min-height: 34px !important;
  margin: 0 0 8px !important;
  border-radius: 17px !important;
  background: linear-gradient(180deg,#ffffff 0%,#e9ffff 42%,#aeeeff 100%) !important;
  box-shadow:
    inset 0 3px 8px rgba(255,255,255,.95),
    inset 0 -6px 10px rgba(0,160,255,.22),
    0 4px 12px rgba(0,0,0,.12) !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-section-head h2,
html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-section-head span{
  font-size: 13px !important;
  font-weight: 900 !important;
  line-height: 1 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-compact-summary-card{
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-compact-summary-table{
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  table-layout: fixed !important;
  overflow: hidden !important;
  border-radius: 14px !important;
  border: 1px solid #9eefff !important;
  box-shadow:
    0 5px 14px rgba(0,0,0,.12),
    inset 0 0 12px rgba(110,230,255,.18) !important;
  text-align: center !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-compact-summary-table th{
  background: linear-gradient(180deg,#efffff 0%,#c9fbff 100%) !important;
  color: #061421 !important;
  border: 1px solid #9eefff !important;
  height: 30px !important;
  padding: 4px 3px !important;
  font-size: 12px !important;
  font-weight: 900 !important;
  line-height: 1.35 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-compact-summary-table td{
  background: linear-gradient(180deg,#ffffff 0%,#f7fdff 100%) !important;
  color: #061421 !important;
  border: 1px solid #d8f7ff !important;
  height: 36px !important;
  padding: 4px 3px !important;
  font-size: 12px !important;
  font-weight: 900 !important;
  line-height: 1.35 !important;
  word-break: break-word !important;
}

html body:not(.login-page):not(.welcome-page) .shil-summary-page .shil-inline-warning{
  background: linear-gradient(180deg,#fff7ec 0%,#eaf7ff 100%) !important;
  border: 1px solid rgba(255,255,255,.75) !important;
  box-shadow:
    inset 0 2px 8px rgba(255,255,255,.75),
    0 4px 12px rgba(0,0,0,.10) !important;
  color: #061421 !important;
  border-radius: 14px !important;
  margin-top: 8px !important;
  padding: 8px 10px !important;
  font-size: 12px !important;
  font-weight: 900 !important;
}

${markerEnd}
`;

const oldMarkers = [
  ["/* SUMMARY_TABLE_COMPACT_START */", "/* SUMMARY_TABLE_COMPACT_END */"],
  ["/* FINAL SUMMARY CLEAN OVERRIDE */", null],
  ["/* FINAL PROJECT SUMMARY TABLE FLAT CLEAN */", null],
  ["/* SHIL COMPACT SUMMARY FINAL CLEAN */", null],
  ["/* SHIL SUMMARY PAGE FINAL FLAT UI */", null],
  ["/* SHIL_NEW_UI_ISOLATION_START */", "/* SHIL_NEW_UI_ISOLATION_END */"],
  ["/* SHIL_SUMMARY_VIVID_FINAL_START */", "/* SHIL_SUMMARY_VIVID_FINAL_END */"]
];

for (const file of files) {
  fs.copyFileSync(file, file + ".summary-vivid-bak");

  let content = fs.readFileSync(file, "utf8");

  for (const [start, end] of oldMarkers) {
    if (end) {
      const re = new RegExp(start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      content = content.replace(re, "");
    } else {
      const re = new RegExp(start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*$", "g");
      content = content.replace(re, "");
    }
  }

  content = content.trimEnd() + "\n\n" + css + "\n";
  fs.writeFileSync(file, content, "utf8");

  console.log("✅ Summary vivid CSS applied:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ Cache cleared.");
