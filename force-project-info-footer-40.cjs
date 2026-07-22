const fs = require("fs");

const files = [
  "src/styles/shil-ui.css",
  "src/index.css",
  "src/app.css",
  "src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const START = "/* SHIL_PROJECT_INFO_FOOTER_FORCE_40_START */";
const END   = "/* SHIL_PROJECT_INFO_FOOTER_FORCE_40_END */";

const css = `
${START}

body:not(.login-page):not(.welcome-page) .shil-project-info-page ~ .shil-fixed-footer,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has(.shil-project-info-page) .shil-fixed-footer,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has([class*="project-info"]) .shil-fixed-footer,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has([class*="ProjectInfo"]) .shil-fixed-footer{
  height:40px !important;
  min-height:40px !important;
  max-height:40px !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
}

body:not(.login-page):not(.welcome-page) .shil-page-shell:has(.shil-project-info-page) .shil-fixed-footer button,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has([class*="project-info"]) .shil-fixed-footer button{
  height:32px !important;
  min-height:32px !important;
  max-height:32px !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
}

body:not(.login-page):not(.welcome-page) .shil-page-shell:has(.shil-project-info-page) .shil-page-content,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has([class*="project-info"]) .shil-page-content{
  padding-bottom:52px !important;
}

body:not(.login-page):not(.welcome-page) .shil-page-shell:has(.shil-project-info-page) .shil-primary-wide,
body:not(.login-page):not(.welcome-page) .shil-page-shell:has([class*="project-info"]) .shil-primary-wide{
  bottom:45px !important;
}

${END}
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for(const file of files){
  fs.copyFileSync(file, file + ".projectinfo-footer40-bak");

  let old = fs.readFileSync(file, "utf8");
  old = old.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + css + "\n", "utf8");
  console.log("✅ project info footer forced:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
