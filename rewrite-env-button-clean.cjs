const fs = require("fs");

const envFiles = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

const btnFiles = [
  "src/components/project/ShilPrimaryButton.jsx",
  "src/src/components/project/ShilPrimaryButton.jsx"
].filter(fs.existsSync);

for (const file of btnFiles) {
  fs.copyFileSync(file, file + ".clean-rewrite-bak");

  const cleanButton = `import React from "react";

export default function ShilPrimaryButton({
  label = "تأیید",
  children,
  className = "",
  style,
  type = "button",
  ...props
}) {
  const baseStyle = {
    height: "46px",
    minHeight: "46px",
    maxHeight: "46px",
    width: "max-content",
    minWidth: "110px",
    maxWidth: "calc(100vw - 32px)",
    padding: "0 18px",
    fontSize: "11px",
    fontWeight: 900,
    lineHeight: 1,
    backgroundImage: "none"
  };

  return (
    <button
      type={type}
      {...props}
      className={["shil-primary-wide", className].filter(Boolean).join(" ")}
      style={{ ...baseStyle, ...(style || {}) }}
    >
      {children || label || "تأیید"}
    </button>
  );
}
`;

  fs.writeFileSync(file, cleanButton, "utf8");
  console.log("✅ ShilPrimaryButton rewritten:", file);
}

for (const file of envFiles) {
  fs.copyFileSync(file, file + ".native-env-button-bak");

  let code = fs.readFileSync(file, "utf8");

  code = code.replace(/import\s+ShilPrimaryButton\s+from\s+["'][^"']+["'];\s*/g, "");

  code = code.replace(
    /const confirmButton = buttons\.find\(\(btn\) => btn\.classList\.contains\("shil-primary-wide"\)\) \|\| buttons\[buttons\.length - 1\];/,
    'const confirmButton = document.querySelector(".shil-env-button");'
  );

  code = code.replace(
    /<ShilPrimaryButton\s+className="shil-env-confirm-button"\s+disabled=\{!environmentReady\}\s+onClick=\{confirmEnvironment\}\s+label="تأیید محیط"\s*\/>/g,
    `<div className="shil-env-action-row">
          <button
            type="button"
            className="shil-env-button"
            disabled={!environmentReady}
            onClick={confirmEnvironment}
          >
            تأیید محیط
          </button>
        </div>`
  );

  fs.writeFileSync(file, code, "utf8");
  console.log("✅ Environment native button applied:", file);
}

const cssFiles = [
  "src/appearance/styles/environment-mobile-first.css",
  "src/src/appearance/styles/environment-mobile-first.css"
].filter(fs.existsSync);

const markers = [
  ["/* SHIL_ENV_REWRITTEN_BUTTON_START */", "/* SHIL_ENV_REWRITTEN_BUTTON_END */"],
  ["/* SHIL_ENV_NATIVE_STATIC_BUTTON_START */", "/* SHIL_ENV_NATIVE_STATIC_BUTTON_END */"],
  ["/* SHIL_ENV_BOTTOM_PADDING_FINAL_START */", "/* SHIL_ENV_BOTTOM_PADDING_FINAL_END */"],
  ["/* SHIL_ENV_FOOTER_AND_STATIC_BUTTON_START */", "/* SHIL_ENV_FOOTER_AND_STATIC_BUTTON_END */"]
];

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const START = "/* SHIL_ENV_CLEAN_NATIVE_BUTTON_START */";
const END = "/* SHIL_ENV_CLEAN_NATIVE_BUTTON_END */";

const cssPatch = `
${START}

body.shil-environment-screen .shil-page-content,
body.shil-environment-screen main.shil-page-content{
  padding-bottom:52px !important;
}

body.shil-environment-screen .shil-env-action-row{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  width:100% !important;
  margin:12px 0 12px !important;
  padding:0 !important;
  position:static !important;
  inset:auto !important;
  transform:none !important;
}

body.shil-environment-screen .shil-env-button{
  all:unset !important;
  box-sizing:border-box !important;

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
  text-align:center !important;

  box-shadow:inset 0 2px 4px rgba(255,255,255,.35),
             inset 0 -2px 4px rgba(0,0,0,.15) !important;

  cursor:pointer !important;
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

${END}
`;

for (const file of cssFiles) {
  fs.copyFileSync(file, file + ".clean-native-button-bak");

  let css = fs.readFileSync(file, "utf8");

  for (const [s, e] of markers) {
    css = css.replace(new RegExp(esc(s) + "[\\s\\S]*?" + esc(e), "g"), "");
  }

  css = css.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "");
  css = css.trimEnd() + "\n\n" + cssPatch + "\n";

  fs.writeFileSync(file, css, "utf8");
  console.log("✅ Environment button CSS cleaned:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ Done");
