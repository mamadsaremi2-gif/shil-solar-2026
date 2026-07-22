const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const badSelector = `body:not(.login-page):not(.welcome-page) [class*="card"], body:not(.login-page):not(.welcome-page) [class*="section"], body:not(.login-page):not(.welcome-page) .shil-project-path-card, body:not(.login-page):not(.welcome-page) .shil-result-card, body:not(.login-page):not(.welcome-page) .shil-summary-card`;

const safeSelector = `body:not(.login-page):not(.welcome-page) [class*="card"]:not(.shil-section-card):not(.shil-compact-summary-card):not(.shil-equipment-bank-card),
body:not(.login-page):not(.welcome-page) [class*="section"]:not(.shil-section-card),
body:not(.login-page):not(.welcome-page) .shil-project-path-card,
body:not(.login-page):not(.welcome-page) .shil-result-card,
body:not(.login-page):not(.welcome-page) .shil-summary-card:not(.shil-compact-summary-card)`;

const markerStart = "/* SHIL_NEW_UI_ISOLATION_START */";
const markerEnd = "/* SHIL_NEW_UI_ISOLATION_END */";

const isolationCss = `
${markerStart}
.shil-summary-page .shil-section-card,
.shil-section-card:has(.shil-compact-summary-table),
.shil-equipment-bank-card,
.shil-compact-summary-card{
  background:transparent !important;
  border:none !important;
  box-shadow:none !important;
}

.shil-summary-page .shil-compact-summary-table,
.shil-equipment-bank-table{
  border-collapse:collapse !important;
  table-layout:fixed !important;
}

.shil-summary-page .shil-compact-summary-table th,
.shil-equipment-bank-table th{
  background:linear-gradient(180deg,#eaffff 0%,#c7fbff 100%) !important;
  border:1px solid #9eefff !important;
  font-size:12px !important;
}

.shil-summary-page .shil-compact-summary-table td,
.shil-equipment-bank-table td{
  background:#fff !important;
  border:1px solid #d9f7ff !important;
  font-size:12px !important;
}
${markerEnd}
`;

for (const file of files) {
  fs.copyFileSync(file, file + ".safe-bak");

  let css = fs.readFileSync(file, "utf8");

  if (css.includes(badSelector)) {
    css = css.replace(badSelector, safeSelector);
    console.log("✅ Selector عمومی محدود شد:", file);
  }

  const re = new RegExp(markerStart + "[\\s\\S]*?" + markerEnd, "g");
  css = css.replace(re, "").trimEnd();

  css += "\n\n" + isolationCss + "\n";

  fs.writeFileSync(file, css, "utf8");
  console.log("✅ UI Isolation اضافه/آپدیت شد:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ انجام شد. حالا npm run dev اجرا می‌شود.");
