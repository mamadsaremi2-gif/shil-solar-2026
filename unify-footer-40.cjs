const fs = require("fs");

const files = [
  "src/styles/shil-ui.css",
  "src/src/styles/shil-ui.css",
  "src/index.css",
  "src/src/index.css",
  "src/app.css",
  "src/src/app.css"
].filter(fs.existsSync);

const START = "/* SHIL_UNIFIED_FOOTER_40_START */";
const END   = "/* SHIL_UNIFIED_FOOTER_40_END */";

const css = `
${START}

:root{
  --shil-footer-h:40px !important;
  --shil-mobile-footer-h:40px !important;
  --footer-height:40px !important;
}

body:not(.login-page):not(.welcome-page) .shil-fixed-footer,
body:not(.login-page):not(.welcome-page) .app-footer,
body:not(.login-page):not(.welcome-page) .mobile-footer,
body:not(.login-page):not(.welcome-page) .shil-footer,
body:not(.login-page):not(.welcome-page) .footer-bar,
body:not(.login-page):not(.welcome-page) [class*="Footer"],
body:not(.login-page):not(.welcome-page) [class*="footer"]{
  height:40px !important;
  min-height:40px !important;
  max-height:40px !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  box-sizing:border-box !important;
}

body:not(.login-page):not(.welcome-page) .shil-fixed-footer button,
body:not(.login-page):not(.welcome-page) .app-footer button,
body:not(.login-page):not(.welcome-page) .mobile-footer button,
body:not(.login-page):not(.welcome-page) .shil-footer button,
body:not(.login-page):not(.welcome-page) .footer-bar button,
body:not(.login-page):not(.welcome-page) [class*="Footer"] button,
body:not(.login-page):not(.welcome-page) [class*="footer"] button{
  height:32px !important;
  min-height:32px !important;
  max-height:32px !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  line-height:1 !important;
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
}

body:not(.login-page):not(.welcome-page) .shil-page-content,
body:not(.login-page):not(.welcome-page) main{
  padding-bottom:calc(40px + env(safe-area-inset-bottom,0px) + 12px) !important;
}

body:not(.login-page):not(.welcome-page) .shil-primary-wide{
  bottom:45px !important;
}

${END}
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for(const file of files){
  fs.copyFileSync(file, file + ".footer40-bak");

  let old = fs.readFileSync(file, "utf8");
  old = old.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + css + "\n", "utf8");
  console.log("✅ footer 40 applied:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
