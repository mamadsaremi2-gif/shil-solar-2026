const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const markerStart = "/* SHIL_FINAL_DELIVERY_VIVID_START */";
const markerEnd = "/* SHIL_FINAL_DELIVERY_VIVID_END */";

const css = `
${markerStart}

html body:not(.login-page):not(.welcome-page) .shil-final-delivery-page,
html body:not(.login-page):not(.welcome-page) .shil-final-delivery-compact,
html body:not(.login-page):not(.welcome-page) .shil-final-one-page-sheet{
  background: rgba(215,235,255,.35) !important;
  border: 1px solid rgba(120,230,255,.85) !important;
  border-radius: 18px !important;
  box-shadow:
    0 8px 22px rgba(0,0,0,.18),
    inset 0 0 18px rgba(160,235,255,.28) !important;
  padding: 8px !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-hero{
  background: linear-gradient(180deg,#ffffff 0%,#e9ffff 42%,#aeeeff 100%) !important;
  border-radius: 18px !important;
  box-shadow:
    inset 0 3px 8px rgba(255,255,255,.95),
    inset 0 -6px 10px rgba(0,160,255,.22),
    0 4px 12px rgba(0,0,0,.12) !important;
  padding: 12px !important;
  margin-bottom: 12px !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-hero *{
  font-weight: 900 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block{
  background: rgba(255,255,255,.70) !important;
  border: 1px solid rgba(120,230,255,.85) !important;
  border-radius: 18px !important;
  box-shadow:
    0 6px 16px rgba(0,0,0,.12),
    inset 0 0 16px rgba(120,230,255,.16) !important;
  padding: 8px !important;
  margin: 12px 0 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block .shil-section-head{
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

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block .shil-section-head h2,
html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block .shil-section-head span{
  font-size: 13px !important;
  font-weight: 900 !important;
  line-height: 1 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block :is(.shil-summary-grid,.shil-form-grid,.shil-final-grid,.shil-info-grid){
  display: grid !important;
  grid-template-columns: repeat(2,minmax(0,1fr)) !important;
  gap: 8px !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block :is(.shil-summary-item,.shil-info-item,.shil-final-item,label){
  background: linear-gradient(180deg,#ffffff 0%,#f7fdff 100%) !important;
  border: 1px solid #9eefff !important;
  border-radius: 14px !important;
  box-shadow:
    0 5px 14px rgba(0,0,0,.10),
    inset 0 0 12px rgba(110,230,255,.14) !important;
  padding: 8px !important;
  font-size: 12px !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block :is(span,small){
  font-size: 11px !important;
  font-weight: 800 !important;
}

html body:not(.login-page):not(.welcome-page) .shil-final-sheet-block :is(strong,b){
  font-size: 13px !important;
  font-weight: 900 !important;
}

${markerEnd}
`;

for (const file of files) {
  fs.copyFileSync(file, file + ".final-delivery-bak");

  let content = fs.readFileSync(file, "utf8");

  const re = new RegExp(
    markerStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" +
    markerEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  content = content.replace(re, "").trimEnd();
  content += "\n\n" + css + "\n";

  fs.writeFileSync(file, content, "utf8");
  console.log("✅ Final delivery UI applied:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ Cache cleared.");
