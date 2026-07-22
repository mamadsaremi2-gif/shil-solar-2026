const fs = require("fs");

const envFiles = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

/* 1) حذف noFooter / hideFooter فقط از صفحه Environment */
for (const file of envFiles) {
  fs.copyFileSync(file, file + ".footer-button-fix-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  code = code
    .replace(/\s+noFooter=\{true\}/g, "")
    .replace(/\s+noFooter/g, "")
    .replace(/\s+hideFooter=\{true\}/g, "")
    .replace(/\s+hideFooter/g, "")
    .replace(/\s+showFooter=\{false\}/g, "")
    .replace(/\s+footer=\{false\}/g, "");

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Environment footer props cleaned:", file);
  } else {
    console.log("ℹ️ No footer prop found in:", file);
  }
}

/* 2) CSS اختصاصی فقط برای صفحه شرایط محیطی */
const cssFiles = [
  "src/appearance/styles/environment-mobile-first.css",
  "src/src/appearance/styles/environment-mobile-first.css"
].filter(fs.existsSync);

const START = "/* SHIL_ENV_FOOTER_AND_STATIC_BUTTON_START */";
const END   = "/* SHIL_ENV_FOOTER_AND_STATIC_BUTTON_END */";

const css = `
${START}

/* فقط صفحه شرایط محیطی */

/* فوتر در Environment حتما دیده شود */
body.shil-environment-screen .shil-fixed-footer,
body.shil-environment-screen footer.shil-fixed-footer{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
  height:40px !important;
  min-height:40px !important;
  max-height:40px !important;
  position:fixed !important;
  left:0 !important;
  right:0 !important;
  bottom:0 !important;
  z-index:1200 !important;
}

/* اگر Shell هنوز کلاس no-footer داشته باشد، خنثی شود */
body.shil-environment-screen .shil-no-footer .shil-fixed-footer{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
}

/* فضای پایین صفحه برای دکمه و فوتر */
body.shil-environment-screen .shil-page-content,
body.shil-environment-screen main.shil-page-content{
  padding-bottom:72px !important;
}

/* دکمه تأیید محیط از حالت شناور خارج شود */
body.shil-environment-screen .shil-primary-wide{
  position:static !important;
  left:auto !important;
  right:auto !important;
  bottom:auto !important;
  top:auto !important;
  transform:none !important;

  display:flex !important;
  align-items:center !important;
  justify-content:center !important;

  width:max-content !important;
  min-width:110px !important;
  max-width:calc(100% - 32px) !important;

  height:46px !important;
  min-height:46px !important;
  max-height:46px !important;

  margin:14px auto 52px !important;
  padding:0 18px !important;

  font-size:11px !important;
  font-weight:900 !important;
  line-height:1 !important;

  z-index:auto !important;
}

/* حذف آیکون یا علامت اضافه */
body.shil-environment-screen .shil-primary-wide::before,
body.shil-environment-screen .shil-primary-wide::after{
  content:none !important;
  display:none !important;
}

/* اگر داخل دکمه span/svg باقی مانده باشد */
body.shil-environment-screen .shil-primary-wide svg,
body.shil-environment-screen .shil-primary-wide img,
body.shil-environment-screen .shil-primary-wide i{
  display:none !important;
}

${END}
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of cssFiles) {
  fs.copyFileSync(file, file + ".footer-button-css-bak");

  let old = fs.readFileSync(file, "utf8");
  old = old.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + css + "\n", "utf8");

  console.log("✅ Environment CSS patched:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
