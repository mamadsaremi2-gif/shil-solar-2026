const fs = require("fs");
const path = require("path");

function walk(dir){
  let out = [];
  if(!fs.existsSync(dir)) return out;

  for(const name of fs.readdirSync(dir)){
    const p = path.join(dir,name);
    const st = fs.statSync(p);

    if(st.isDirectory()){
      if(!["node_modules",".git","dist","build"].includes(name)){
        out = out.concat(walk(p));
      }
    }else if(/\.(jsx|tsx|js|ts|css)$/.test(name)){
      out.push(p);
    }
  }
  return out;
}

const allFiles = walk("src");

/* 1) حذف Patch قبلی دکمه که دیر اعمال می‌شد */
const patchFiles = [
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const starts = [
  ["/* SHIL_PRIMARY_BUTTON_FINAL_START */", "/* SHIL_PRIMARY_BUTTON_FINAL_END */"],
  ["/* SHIL_PRIMARY_BUTTON_SAFE_START */", "/* SHIL_PRIMARY_BUTTON_SAFE_END */"]
];

function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

for(const file of patchFiles){
  fs.copyFileSync(file, file + ".primary-clean-bak");
  let code = fs.readFileSync(file,"utf8");

  for(const [s,e] of starts){
    code = code.replace(new RegExp(esc(s) + "[\\s\\S]*?" + esc(e), "g"), "");
  }

  fs.writeFileSync(file, code.trimEnd() + "\n", "utf8");
  console.log("✅ removed old button patch:", file);
}

/* 2) تغییر متن‌های طولانی دکمه‌ها در JSX/JS */
const patterns = [
  /تأیید مرحله و ورود به شرایط محیطی/g,
  /تایید مرحله و ورود به شرایط محیطی/g,
  /تأیید شرایط محیطی و ادامه/g,
  /تایید شرایط محیطی و ادامه/g,
  /تأیید تنظیمات و رفتن به چکیده/g,
  /تایید تنظیمات و رفتن به چکیده/g,
  /اجرای محاسبات نهایی/g
];

for(const file of allFiles.filter(f => /\.(jsx|tsx|js|ts)$/.test(f))){
  let code = fs.readFileSync(file,"utf8");
  let old = code;

  for(const re of patterns){
    code = code.replace(re, "تأیید اطلاعات");
  }

  /* حذف + داخل دکمه‌های shil-primary-wide اگر به صورت متن آمده باشد */
  code = code.replace(/(<button[^>]*className=["'][^"']*shil-primary-wide[^"']*["'][^>]*>)\s*\+\s*/g, "$1");
  code = code.replace(/(<button[^>]*className=["'][^"']*shil-primary-wide[^"']*["'][^>]*>)[\\s\\S]*?(<\\/button>)/g, (m, open, close) => {
    if(/shil-primary-wide/.test(open) && /تأیید اطلاعات|تأیید|تایید|ادامه|محاسبات|شرایط|چکیده/.test(m)){
      return open + "تأیید اطلاعات" + close;
    }
    return m;
  });

  if(code !== old){
    fs.copyFileSync(file, file + ".button-text-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ button text updated:", file);
  }
}

/* 3) CSS دائمی جایگاه و ظاهر دکمه */
const cssFiles = [
  "src/app.css",
  "src/src/app.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const START = "/* SHIL_PRIMARY_WIDE_POSITION_FINAL_START */";
const END = "/* SHIL_PRIMARY_WIDE_POSITION_FINAL_END */";

const css = `
${START}
body:not(.login-page):not(.welcome-page) .shil-primary-wide{
  bottom:68px !important;
  height:46px !important;
  min-height:46px !important;
  max-height:46px !important;
  width:max-content !important;
  min-width:110px !important;
  max-width:calc(100vw - 32px) !important;
  padding:0 18px !important;
  font-size:11px !important;
  font-weight:900 !important;
  line-height:1 !important;
  background-image:none !important;
  z-index:1200 !important;
}

body:not(.login-page):not(.welcome-page) .shil-primary-wide::before,
body:not(.login-page):not(.welcome-page) .shil-primary-wide::after{
  content:none !important;
  display:none !important;
  background:none !important;
}
${END}
`;

for(const file of cssFiles){
  fs.copyFileSync(file, file + ".primary-css-bak");
  let code = fs.readFileSync(file,"utf8");
  code = code.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "");
  fs.writeFileSync(file, code.trimEnd() + "\n\n" + css + "\n", "utf8");
  console.log("✅ button css applied:", file);
}

fs.rmSync("node_modules/.vite", {recursive:true, force:true});
fs.rmSync("dist", {recursive:true, force:true});
fs.rmSync("build", {recursive:true, force:true});

console.log("✅ done");
