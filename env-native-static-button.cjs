const fs = require("fs");

const envFiles = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

for (const file of envFiles) {
  fs.copyFileSync(file, file + ".env-native-button-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  const idx = code.indexOf("shil-env-confirm-button");
  if (idx !== -1) {
    const start = code.lastIndexOf("<ShilPrimaryButton", idx);
    const end = code.indexOf("/>", idx);

    if (start !== -1 && end !== -1) {
      const nativeButton = `
<button
  type="button"
  className="shil-env-confirm-button-static"
  disabled={!environmentReady}
  onClick={confirmEnvironment}
>
  تأیید محیط
</button>`;

      code = code.slice(0, start) + nativeButton + code.slice(end + 2);
    }
  }

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Environment button replaced with native static button:", file);
  } else {
    console.log("⚠️ No replacement made:", file);
  }
}

const cssFiles = [
  "src/appearance/styles/environment-mobile-first.css",
  "src/src/appearance/styles/environment-mobile-first.css"
].filter(fs.existsSync);

const START = "/* SHIL_ENV_NATIVE_STATIC_BUTTON_START */";
const END = "/* SHIL_ENV_NATIVE_STATIC_BUTTON_END */";

const css = `
${START}

body.shil-environment-screen .shil-env-confirm-button-static{
  position:static !important;
  inset:auto !important;
  transform:none !important;

  display:flex !important;
  align-items:center !important;
  justify-content:center !important;

  width:max-content !important;
  min-width:110px !important;
  height:46px !important;
  min-height:46px !important;
  max-height:46px !important;

  margin:12px auto 52px !important;
  padding:0 18px !important;

  background:#8a2be2 !important;
  color:#fff !important;
  border:2px solid #6b1fd3 !important;
  border-radius:22px !important;

  font-size:11px !important;
  font-weight:900 !important;
  line-height:1 !important;
  white-space:nowrap !important;

  box-shadow:inset 0 2px 4px rgba(255,255,255,.35),
             inset 0 -2px 4px rgba(0,0,0,.15) !important;
}

body.shil-environment-screen .shil-env-confirm-button-static::before,
body.shil-environment-screen .shil-env-confirm-button-static::after{
  content:none !important;
  display:none !important;
}

${END}
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of cssFiles) {
  fs.copyFileSync(file, file + ".env-native-button-css-bak");

  let old = fs.readFileSync(file, "utf8");
  old = old.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + css + "\n", "utf8");
  console.log("✅ Environment native button CSS added:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
