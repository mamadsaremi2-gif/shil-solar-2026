const fs = require("fs");

const envFiles = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

const nativeButton = `
<div className="shil-env-action-row">
  <button
    type="button"
    className="shil-env-button"
    disabled={!environmentReady}
    onClick={confirmEnvironment}
  >
    تأیید محیط
  </button>
</div>`;

for (const file of envFiles) {
  fs.copyFileSync(file, file + ".env-button-rewrite-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  code = code.replace(/<div className="shil-env-action-row">[\s\S]*?<\/div>/g, "");

  const markerIndex = code.indexOf("shil-env-confirm-button");

  if (markerIndex !== -1) {
    const start = code.lastIndexOf("<ShilPrimaryButton", markerIndex);
    const end = code.indexOf("/>", markerIndex);

    if (start !== -1 && end !== -1) {
      code = code.slice(0, start) + nativeButton + code.slice(end + 2);
    }
  }

  code = code.replace(/import\s+ShilPrimaryButton\s+from\s+["'][^"']+["'];\s*/g, "");

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Environment button rewritten:", file);
  } else {
    console.log("⚠️ No button rewrite needed/found:", file);
  }
}

const cssFiles = [
  "src/appearance/styles/environment-mobile-first.css",
  "src/src/appearance/styles/environment-mobile-first.css"
].filter(fs.existsSync);

const START = "/* SHIL_ENV_REWRITTEN_BUTTON_START */";
const END = "/* SHIL_ENV_REWRITTEN_BUTTON_END */";

const css = `
${START}

body.shil-environment-screen .shil-env-action-row{
  display:flex !important;
  justify-content:center !important;
  align-items:center !important;
  width:100% !important;
  margin:12px 0 52px !important;
  padding:0 !important;
  position:static !important;
  inset:auto !important;
  transform:none !important;
}

body.shil-environment-screen .shil-env-button{
  position:static !important;
  inset:auto !important;
  left:auto !important;
  right:auto !important;
  top:auto !important;
  bottom:auto !important;
  transform:none !important;

  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;

  width:max-content !important;
  min-width:110px !important;
  max-width:calc(100% - 32px) !important;

  height:46px !important;
  min-height:46px !important;
  max-height:46px !important;

  margin:0 !important;
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

  cursor:pointer !important;
  z-index:auto !important;
}

body.shil-environment-screen .shil-env-button:disabled{
  opacity:.55 !important;
  cursor:not-allowed !important;
}

body.shil-environment-screen .shil-env-button::before,
body.shil-environment-screen .shil-env-button::after{
  content:none !important;
  display:none !important;
}

/* SHIL_ENV_REWRITTEN_BUTTON_END */
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of cssFiles) {
  fs.copyFileSync(file, file + ".env-button-rewrite-css-bak");

  let old = fs.readFileSync(file, "utf8");
  old = old.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + css + "\n", "utf8");
  console.log("✅ Environment button CSS connected:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
